import axios from "axios";
import * as bp from ".botpress";
import {
  ProcessProductsConfig,
  ProductRow,
  MagentoProduct,
  CustomAttribute,
  OAuthClient,
  OAuthToken,
} from "../types/magento";
import { apiCallWithRetry } from "./magento-api";
import { StockItemSchema, ReviewsArraySchema } from "../misc/zod-schemas";

interface StockInfo {
  qty: number;
  isInStock: boolean;
}

interface ReviewInfo {
  averageRating: number;
  reviewCount: number;
}

interface ImageInfo {
  imageUrl: string;
  thumbnailUrl: string;
}

async function fetchStockInfo(
  product: MagentoProduct,
  magento_domain: string,
  store_code: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  logger: bp.Logger,
): Promise<StockInfo> {
  if (product.extension_attributes?.stock_item) {
    return {
      qty: product.extension_attributes.stock_item.qty || 0,
      isInStock: product.extension_attributes.stock_item.is_in_stock || false,
    };
  }

  const stockUrl = `https://${magento_domain}/rest/${store_code}/V1/stockItems/${encodeURIComponent(product.sku)}`;
  const stockResponse = await apiCallWithRetry(
    () =>
      axios({
        method: "GET",
        url: stockUrl,
        headers: {
          ...oauth.toHeader(
            oauth.authorize({ url: stockUrl, method: "GET" }, token),
          ),
          ...headers,
        },
      }),
    logger,
  );
  const stockData = StockItemSchema.parse(stockResponse.data);
  return {
    qty: stockData.qty,
    isInStock: stockData.is_in_stock,
  };
}

async function fetchReviewInfo(
  product: MagentoProduct,
  retrieve_reviews: boolean,
  magento_domain: string,
  store_code: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  logger: bp.Logger,
): Promise<ReviewInfo> {
  if (!retrieve_reviews) {
    return { averageRating: 0, reviewCount: 0 };
  }

  try {
    const reviewsUrl = `https://${magento_domain}/rest/${store_code}/V1/products/${encodeURIComponent(product.sku)}/reviews`;
    const reviewsResponse = await apiCallWithRetry(
      () =>
        axios({
          method: "GET",
          url: reviewsUrl,
          headers: {
            ...oauth.toHeader(
              oauth.authorize({ url: reviewsUrl, method: "GET" }, token),
            ),
            ...headers,
          },
        }),
      logger,
    );
    const reviews = ReviewsArraySchema.parse(reviewsResponse.data);
    const reviewCount = reviews.length;

    if (reviewCount === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => {
      const ratingObj =
        Array.isArray(review.ratings) && review.ratings.length > 0
          ? review.ratings[0]
          : null;
      return sum + (ratingObj ? Number(ratingObj.value) : 0);
    }, 0);

    const averageRating = Math.round((totalRating / reviewCount) * 10) / 10;
    return { averageRating, reviewCount };
  } catch (e) {
    logger.warn(`Could not fetch reviews for product ${product.sku}`);
    return { averageRating: 0, reviewCount: 0 };
  }
}

function getImageInfo(
  product: MagentoProduct,
  magento_domain: string,
): ImageInfo {
  const mainImage = product.media_gallery_entries?.[0];
  if (mainImage?.file) {
    const imageUrl = `https://${magento_domain}/media/catalog/product${mainImage.file}`;
    return { imageUrl, thumbnailUrl: imageUrl };
  }
  return { imageUrl: "", thumbnailUrl: "" };
}

function getProductDataMap(
  product: MagentoProduct,
  stockInfo: StockInfo,
  reviewInfo: ReviewInfo,
  imageInfo: ImageInfo,
): Record<string, string | number | boolean> {
  return {
    sku: product.sku || "",
    name: product.name || "",
    description: String(
      product.custom_attributes?.find(
        (a: CustomAttribute) => a.attribute_code === "description",
      )?.value || "",
    ),
    price: product.price || 0,
    original_price: product.price || 0,
    currency: "USD",
    image_url: imageInfo.imageUrl || "",
    thumbnail_url: imageInfo.thumbnailUrl || "",
    stock_qty: stockInfo.qty,
    is_in_stock: stockInfo.isInStock,
    average_rating: Math.round(reviewInfo.averageRating * 100) / 100,
    review_count: reviewInfo.reviewCount,
  };
}

function getCustomAttributeValue(
  columnName: string,
  product: MagentoProduct,
  customAttributeCodes: string[],
  columnNameMappings: Record<string, string>,
  attributeMappings: Record<string, Record<string, string>>,
): string | number | boolean | null {
  if (
    !customAttributeCodes.includes(columnName) ||
    !product.custom_attributes
  ) {
    return null;
  }

  const originalAttributeName = columnNameMappings[columnName] || columnName;
  const attr = product.custom_attributes.find(
    (a: CustomAttribute) => a.attribute_code === originalAttributeName,
  );

  if (!attr) {
    return null;
  }

  const attrValue = attr.value;
  if (
    (typeof attrValue === "string" || typeof attrValue === "number") &&
    attributeMappings[originalAttributeName]?.[attrValue] !== undefined
  ) {
    return attributeMappings[originalAttributeName]?.[attrValue];
  } else if (
    Array.isArray(attrValue) &&
    attributeMappings[originalAttributeName]
  ) {
    return attrValue
      .map(
        (v: string | number) =>
          attributeMappings[originalAttributeName]?.[v] ?? v,
      )
      .join(", ");
  } else {
    return String(attrValue || "");
  }
}

function convertValueToColumnType(
  value: string | number | boolean | null,
  columnType: string | undefined,
): string | number | boolean | null {
  if (value !== undefined && value !== null) {
    if (columnType === "number") {
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    } else if (columnType === "boolean") {
      return Boolean(value);
    } else {
      return String(value ?? "");
    }
  } else {
    return columnType === "number"
      ? null
      : columnType === "boolean"
        ? false
        : "";
  }
}

async function processSingleProduct(
  product: MagentoProduct,
  retrieve_reviews: boolean,
  config: ProcessProductsConfig,
): Promise<ProductRow> {
  const {
    logger,
    magento_domain,
    oauth,
    token,
    headers,
    availableColumns,
    customAttributeCodes,
    attributeMappings,
    columnNameMappings,
    tableSchema,
    store_code,
  } = config;

  const stockInfo = await fetchStockInfo(
    product,
    magento_domain,
    store_code,
    oauth,
    token,
    headers,
    logger,
  );
  const reviewInfo = await fetchReviewInfo(
    product,
    retrieve_reviews,
    magento_domain,
    store_code,
    oauth,
    token,
    headers,
    logger,
  );
  const imageInfo = getImageInfo(product, magento_domain);

  const productDataMap = getProductDataMap(
    product,
    stockInfo,
    reviewInfo,
    imageInfo,
  );
  const row: ProductRow = {};

  for (const columnName of availableColumns) {
    let value: string | number | boolean | null = null;

    // Try to get value from standard product data
    const mappedValue = productDataMap[columnName];
    if (mappedValue !== undefined) {
      value = mappedValue;
    }

    // Try to get value from custom attributes if not found
    if (value === undefined || value === null) {
      value = getCustomAttributeValue(
        columnName,
        product,
        customAttributeCodes,
        columnNameMappings,
        attributeMappings,
      );
    }

    // Convert value to appropriate column type
    const columnType = tableSchema.properties[columnName]?.type;
    row[columnName] = convertValueToColumnType(value, columnType);
  }

  return row;
}

export async function processProducts(
  retrieve_reviews: boolean,
  products: MagentoProduct[],
  config: ProcessProductsConfig,
): Promise<ProductRow[]> {
  const rowsToInsert: ProductRow[] = [];

  for (const product of products) {
    try {
      const row = await processSingleProduct(product, retrieve_reviews, config);
      rowsToInsert.push(row);
    } catch (error) {
      config.logger.error(
        `Failed to process product ${product.sku ?? ""}: ${error instanceof Error ? error.message : "Unknown error"}`,
        error,
      );
    }
  }

  return rowsToInsert;
}
