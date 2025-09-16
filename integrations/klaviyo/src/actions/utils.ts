import { FilterBuilder } from "klaviyo-api";
import { KlaviyoPropertyValue } from "./types";

// Utility function to convert a string or date to a date
const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return value;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
};

// Returns the filter string (e.g. filterBuilder.equals('email', 'test@test.com').build() => "equals(email, test@test.com)")

export const buildFilter = (
  field: string,
  operator: string,
  value: string | Date
): string => {
  const filterBuilder = new FilterBuilder();

  switch (operator) {
    case "equals":
      return filterBuilder.equals(field, value).build();
    case "greater-than":
      return filterBuilder.greaterThan(field, toDate(value)).build();
    case "less-than":
      return filterBuilder.lessThan(field, toDate(value)).build();
    case "greater-or-equal":
      return filterBuilder.greaterOrEqual(field, toDate(value)).build();
    case "less-or-equal":
      return filterBuilder.lessOrEqual(field, toDate(value)).build();
    case "contains":
      return filterBuilder.contains(field, value as string).build();
    case "starts-with":
      return filterBuilder.startsWith(field, value as string).build();
    case "ends-with":
      return filterBuilder.endsWith(field, value as string).build();
    default:
      throw new Error(`Unsupported filter operator: ${operator}`);
  }
};

export const parseJsonSafely = (
  properties: string
): Record<string, KlaviyoPropertyValue> => {
  try {
    return JSON.parse(properties);
  } catch {
    return {};
  }
};

/**
 * Converts Klaviyo profile data to the standardized profile format
 */
export const formatProfileResponse = (profileData: {
  id?: string | null | undefined;
  attributes: {
    email?: string | null;
    phoneNumber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    organization?: string | null;
    title?: string | null;
    locale?: string | null;
    location?: {
      address1?: string | null;
      address2?: string | null;
      city?: string | null;
      country?: string | null;
      region?: string | null;
      zip?: string | null;
    } | null;
    properties?: Record<string, any> | null;
  };
}) => ({
  id: profileData.id || "",
  email: profileData.attributes.email || undefined,
  phone: profileData.attributes.phoneNumber || undefined,
  firstName: profileData.attributes.firstName || undefined,
  lastName: profileData.attributes.lastName || undefined,
  organization: profileData.attributes.organization || undefined,
  title: profileData.attributes.title || undefined,
  locale: profileData.attributes.locale || undefined,
  location: profileData.attributes.location
    ? {
        address1: profileData.attributes.location.address1 || undefined,
        address2: profileData.attributes.location.address2 || undefined,
        city: profileData.attributes.location.city || undefined,
        country: profileData.attributes.location.country || undefined,
        region: profileData.attributes.location.region || undefined,
        zip: profileData.attributes.location.zip || undefined,
      }
    : undefined,
  properties: profileData.attributes.properties
    ? JSON.stringify(profileData.attributes.properties)
    : undefined,
});

export const formatProfilesArray = (
  profilesData: Array<{
    id?: string | null | undefined;
    attributes: {
      email?: string | null;
      phoneNumber?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      organization?: string | null;
      title?: string | null;
      locale?: string | null;
      location?: {
        address1?: string | null;
        address2?: string | null;
        city?: string | null;
        country?: string | null;
        region?: string | null;
        zip?: string | null;
      } | null;
      properties?: Record<string, any> | null;
    };
  }>
) => profilesData.map(formatProfileResponse);
