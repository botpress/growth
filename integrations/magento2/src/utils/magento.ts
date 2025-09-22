import * as crypto from "crypto";
import * as bp from ".botpress";
import { AttributeMapping, ColumnNameMapping, Filter } from "../types/magento";

export function toMagentoAttributeCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function shortenColumnName(name: string): string {
  if (name.length <= 30) {
    return name;
  }

  const truncated = name.substring(0, 26);
  const hash = crypto
    .createHash("md5")
    .update(name)
    .digest("hex")
    .substring(0, 3);
  return `${truncated}_${hash}`;
}

export function parseAttributeMappings(
  attributeMappingsInput:
    | string
    | Record<string, Record<string, string>>
    | undefined
): AttributeMapping {
  if (typeof attributeMappingsInput === "string") {
    try {
      return JSON.parse(attributeMappingsInput);
    } catch {
      return {};
    }
  } else if (
    typeof attributeMappingsInput === "object" &&
    attributeMappingsInput !== null
  ) {
    return attributeMappingsInput;
  }
  return {};
}

export function parseColumnNameMappings(
  columnNameMappingsInput: string | undefined
): ColumnNameMapping {
  if (typeof columnNameMappingsInput === "string") {
    try {
      return JSON.parse(columnNameMappingsInput);
    } catch {
      return {};
    }
  }
  return {};
}

// Filter utility functions
export function parseFilters(input: any, logger: bp.Logger): Filter[] | null {
  let filtersInput = input.searchCriteria;

  // Handle empty/undefined searchCriteria (optional field)
  if (!filtersInput || filtersInput === "") {
    logger.forBot().info("No searchCriteria provided, returning empty filters");
    return [];
  }

  // Parse JSON string if needed
  if (typeof filtersInput === "string") {
    try {
      filtersInput = JSON.parse(filtersInput);
    } catch (err) {
      logger.forBot().error(`Failed to parse JSON input: ${err}`);
      return null;
    }
  }

  // Validate that input is an array
  if (!Array.isArray(filtersInput)) {
    logger.forBot().error(`Input is not an array: ${typeof filtersInput}`);
    return null;
  }

  return filtersInput;
}

export function buildFilterCriteria(
  filters: Filter[],
  logger: bp.Logger
): string {
  const filterGroups: string[] = [];

  filters.forEach((filter, idx) => {
    if (!filter.field || !filter.condition) {
      logger
        .forBot()
        .warn(`Skipping filter ${idx + 1} - missing field or condition`);
      return;
    }

    const baseFilter = `searchCriteria[filterGroups][${idx}][filters][0][field]=${encodeURIComponent(filter.field)}&searchCriteria[filterGroups][${idx}][filters][0][conditionType]=${filter.condition}`;

    // Add value only for conditions that require it
    if (
      filter.value &&
      filter.condition !== "notnull" &&
      filter.condition !== "null"
    ) {
      const fullFilter = `${baseFilter}&searchCriteria[filterGroups][${idx}][filters][0][value]=${encodeURIComponent(filter.value)}`;
      filterGroups.push(fullFilter);
    } else {
      filterGroups.push(baseFilter);
    }
  });

  return filterGroups.join("&");
}
