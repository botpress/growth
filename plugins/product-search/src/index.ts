import * as bp from ".botpress";
import { Zai } from "@botpress/zai";
import { z } from "@bpinternal/zui";

const getPluginClient = (botClient: bp.Client): any => {
  return botClient as any;
};

const getTableName = (props: any): string | undefined => {
  let tableName =
    (props.configuration as { tableName?: string }).tableName ?? "ProductTable";
  tableName = tableName.replace(/\s+/g, "");
  if (!tableName || /^\d/.test(tableName)) {
    props.logger.error("Table names cannot start with a number");
    return undefined;
  }

  if (!tableName.endsWith("Table")) {
    tableName += "Table";
  }

  return tableName;
}

interface SearchConfig {
  limit: number;
  offset: number;
  search?: string;
  filter?: any;
}

interface SearchAndFilterConfig {
  search: string;
  filter: string;
}

const searchAndFilterSchema = z.array(
  z.object({
    search: z.string(),
    filter: z.string(),
  })
)

async function messageToSF(message: string, props: any): Promise<SearchAndFilterConfig> {
  const zai = new Zai({ client: getPluginClient(props.client) });
  const context = await zai.extract(
    message,
    searchAndFilterSchema,
    {
      instructions: `
      Grab the user's message to search for products and split it into a search query and a filter.
      The search query should be a string that can be used to search for products.
      The filter should be a string to place a filter for price if the user mentions a price range (i.e price less than 50 or price between 50 and 100 or etc...).
      Else the filter should be an empty string.

      Return it in the following format: (Return only the JSON payload--no additional text)
      [
        {
          search: "search query", // keywords that can be sent to the product-search engine
          filter: "filter", // price condition, or "" if none mentioned
        }
      ]

      Extraction rules:
      1. search -- copy the product keywords and any relevant descriptors (brand, color, size, etc...)
      2. filter -- if the user states a price constraint, convert it to a simple expression:
        - under/less than x --> price < x
        - over/greater than x --> price > x
        - between x and y --> price >= x and price <= y
        - otherwise, leave empty
      `,
    },
  )

  return context[0] || { search: "", filter: "" };
}

const createSearchConfig = async (props: any): Promise<SearchConfig> => {
  const { limit, offset} = props.configuration;
  const message = props.input.message;
  const { search, filter } = await messageToSF(message, props);

  return {
    limit,
    offset,
    search,
    filter
  }
}

const plugin = new bp.Plugin({
  actions: {
    searchProducts: async (props) => {
      const { limit, offset, search, filter } = await createSearchConfig(props);

      const searchConfig = {
        limit,
        offset,
        search,
        filter
      }

      const pluginClient = getPluginClient(props.client);
      const tableName = getTableName(props);

      if (!tableName) {
        props.logger.error("Table name is required");
        return {
          error: "Table name is required",
        };
      }

      const productSearchResults = await pluginClient.tables.findTableRows(tableName, searchConfig);

      return productSearchResults;
      
    },
  },
});

export default plugin;
