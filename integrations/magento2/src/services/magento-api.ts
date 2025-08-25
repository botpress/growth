import axios from "axios";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import * as bp from ".botpress";
import {
  MagentoConfiguration,
  Filter,
  AttributeMapping,
  OAuthClient,
  OAuthToken,
  MagentoProduct,
} from "../types/magento";
import { ProductAttributeSchema, ProductListSchema } from "../misc/zod-schemas";
import { sleep } from "../utils/common";

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;
const DEFAULT_USER_AGENT = "Botpress-Magento2-Integration/1.0";

export async function apiCallWithRetry<T>(
  request: () => Promise<T>,
  logger: bp.Logger,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_DELAY,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && (status === 429 || status >= 500) && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i) * (1 + Math.random());
          logger
            .forBot()
            .warn(
              `API call failed with status ${status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${
                i + 1
              }/${maxRetries})`,
            );
          await sleep(delay);
          continue;
        }
      }
      logger
        .forBot()
        .error(
          "API call failed after all retries or with a non-retriable error.",
          error,
        );
      throw error;
    }
  }
  throw new Error("API call failed after all retries.");
}

export function createOAuthClient(config: MagentoConfiguration): OAuthClient {
  return new OAuth({
    consumer: {
      key: config.consumer_key,
      secret: config.consumer_secret,
    },
    signature_method: "HMAC-SHA256",
    hash_function(baseString: string, key: string) {
      return crypto
        .createHmac("sha256", key)
        .update(baseString)
        .digest("base64");
    },
  });
}

export function createHeaders(
  config: MagentoConfiguration,
  botId: string,
): Record<string, string> {
  return {
    "User-Agent": config.user_agent || DEFAULT_USER_AGENT,
    accept: "application/json",
  };
}

export function createHttpHeaders(
  config: MagentoConfiguration,
  botId: string,
): Record<string, string> {
  return {
    Authorization: `bearer ${config.botpress_pat}`,
    "x-bot-id": botId,
    "Content-Type": "application/json",
  };
}

function createFilterGroup(filters: Filter[], groupIndex: number): string[] {
  return filters
    .map((filter: Filter, filterIndex: number) => {
      if (!filter.field || !filter.condition) return "";

      const base = `searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][field]=${encodeURIComponent(
        filter.field,
      )}&searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][condition_type]=${filter.condition}`;

      if (
        filter.value !== undefined &&
        filter.value !== null &&
        filter.condition !== "notnull" &&
        filter.condition !== "null"
      ) {
        return `${base}&searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][value]=${encodeURIComponent(
          filter.value.toString(),
        )}`;
      }

      return base;
    })
    .filter(Boolean);
}

export function buildFilterCriteria(
  filters: Filter[],
  attributeMappings: AttributeMapping,
): string {
  const filterGroups: string[] = [];
  const fieldGroups: Record<string, Filter[]> = {};
  const separateGroups: Filter[] = [];

  // Group filters by field type
  filters.forEach((filter: Filter) => {
    if (!filter.field || !filter.condition) return;

    if (
      filter.field === "price" &&
      (filter.condition === "from" || filter.condition === "to")
    ) {
      separateGroups.push(filter);
    } else {
      fieldGroups[filter.field] = fieldGroups[filter.field] || [];
      fieldGroups[filter.field]!.push(filter);
    }
  });

  let groupIndex = 0;

  // Process grouped filters
  Object.entries(fieldGroups).forEach(([_, fieldFilters]) => {
    const groupFilters = createFilterGroup(fieldFilters, groupIndex);
    filterGroups.push(...groupFilters);
    groupIndex++;
  });

  // Process separate price filters
  separateGroups.forEach((filter: Filter) => {
    const base = `searchCriteria[filterGroups][${groupIndex}][filters][0][field]=${encodeURIComponent(
      filter.field,
    )}&searchCriteria[filterGroups][${groupIndex}][filters][0][condition_type]=${filter.condition}`;

    if (
      filter.value &&
      filter.condition !== "notnull" &&
      filter.condition !== "null"
    ) {
      filterGroups.push(
        `${base}&searchCriteria[filterGroups][${groupIndex}][filters][0][value]=${encodeURIComponent(filter.value.toString())}`,
      );
    } else {
      filterGroups.push(base);
    }
    groupIndex++;
  });

  return filterGroups.join("&");
}

async function fetchAttributeOptions(
  attrCode: string,
  magentoDomain: string,
  storeCode: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  log: bp.Logger,
): Promise<Record<string, string> | null> {
  try {
    const attrUrl = `https://${magentoDomain}/rest/${storeCode}/V1/products/attributes/${attrCode}`;
    const attrResponse = await apiCallWithRetry(
      () =>
        axios({
          method: "GET",
          url: attrUrl,
          headers: {
            ...oauth.toHeader(
              oauth.authorize({ url: attrUrl, method: "GET" }, token),
            ),
            ...headers,
          },
        }),
      log,
    );
    const attribute = ProductAttributeSchema.parse(attrResponse.data);

    if (attribute.options && attribute.options.length > 0) {
      const options: Record<string, string> = {};
      for (const option of attribute.options) {
        options[option.label] = option.value;
      }
      log.info(
        `Fetched ${attribute.options.length} options for attribute ${attrCode}`,
      );
      return options;
    }
    return null;
  } catch (error) {
    log.warn(`Failed to get attribute mapping for ${attrCode}:`, error);
    return null;
  }
}

export async function processFilters(
  filtersJson: string,
  attributeMappings: AttributeMapping,
  magentoDomain: string,
  storeCode: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  log: bp.Logger,
): Promise<string> {
  try {
    let filters: Filter[] = JSON.parse(filtersJson);
    if (!Array.isArray(filters)) {
      throw new Error("filters_json must be a JSON array");
    }

    const standardFields = [
      "sku",
      "name",
      "description",
      "price",
      "original_price",
      "currency",
      "image_url",
      "thumbnail_url",
      "stock_qty",
      "is_in_stock",
      "average_rating",
      "review_count",
    ];
    const attributeFields = Array.from(
      new Set(
        filters
          .map((f: Filter) => f.field)
          .filter(
            (f: string | undefined): f is string =>
              f !== undefined && !standardFields.includes(f),
          ),
      ),
    );

    // Fetch attribute mappings for custom fields
    for (const attrCode of attributeFields) {
      const options = await fetchAttributeOptions(
        attrCode,
        magentoDomain,
        storeCode,
        oauth,
        token,
        headers,
        log,
      );
      if (options) {
        attributeMappings[attrCode] = options;
      }
    }

    // Map filter values using attribute mappings
    filters = filters.map((filter: Filter) => {
      if (
        filter.field !== undefined &&
        filter.value !== undefined &&
        attributeMappings[filter.field]?.[filter.value.toString()] !== undefined
      ) {
        return {
          ...filter,
          value: attributeMappings[filter.field]?.[filter.value.toString()],
        };
      }
      return filter;
    });

    return buildFilterCriteria(filters, attributeMappings);
  } catch (err) {
    throw new Error(
      `filters_json is not valid JSON: ${err instanceof Error ? err.message : "Unknown parsing error"}`,
    );
  }
}

export async function fetchProducts(
  page: number,
  pageSize: number,
  filterCriteria: string | undefined,
  magentoDomain: string,
  storeCode: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  log: bp.Logger,
): Promise<{ products: MagentoProduct[]; totalCount: number }> {
  const searchCriteria = `searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}${filterCriteria ? `&${filterCriteria}` : ""}`;
  const productsUrl = `https://${magentoDomain}/rest/${storeCode}/V1/products?${searchCriteria}`;

  log.info(`Fetching page ${page} from: ${productsUrl}`);

  const productsResponse = await apiCallWithRetry(
    () =>
      axios({
        method: "GET",
        url: productsUrl,
        headers: {
          ...oauth.toHeader(
            oauth.authorize({ url: productsUrl, method: "GET" }, token),
          ),
          ...headers,
        },
      }),
    log,
  );

  const parsed = ProductListSchema.parse(productsResponse.data);
  return {
    products: parsed.items as MagentoProduct[],
    totalCount: parsed.total_count,
  };
}

export async function sendWebhook(
  webhookId: string,
  payload: Record<string, unknown>,
  log: bp.Logger,
): Promise<void> {
  const webhookUrl = `https://webhook.botpress.cloud/${webhookId}`;

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      log.error(`Webhook failed with status ${response.status}`);
    }
  } catch (error) {
    log.error("Failed to send webhook to continue sync:", error);
  }
}
