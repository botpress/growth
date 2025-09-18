import { RuntimeError } from "@botpress/sdk";
import type {
  ProfileCreateQuery,
  ProfilePartialUpdateQuery,
  SubscriptionCreateJobCreateQuery,
  SubscriptionChannels,
} from "klaviyo-api";
import { getProfilesApi } from "../auth";
import { MAX_PROFILES_PER_BULK_OPERATION } from "../misc/constants";
import { getErrorMessage } from "../misc/error-handler";
import {
  buildFilter,
  parseJsonSafely,
  formatProfileResponse,
  formatProfilesArray,
} from "../misc/utils";
import * as bp from ".botpress";

export const createProfile: bp.IntegrationProps["actions"]["createProfile"] =
  async ({ ctx, logger, input }) => {
    const {
      email,
      phone,
      firstName,
      lastName,
      organization,
      title,
      locale,
      location,
      customProperties,
    } = input;

    if (!email && !phone) {
      throw new RuntimeError(
        "Either email or phone is required to create a profile"
      );
    }

    try {
      const profilesApi = getProfilesApi(ctx);

      const profileAttributes: ProfileCreateQuery["data"]["attributes"] = {};

      if (email) profileAttributes.email = email;
      if (phone) profileAttributes.phoneNumber = phone;
      if (firstName) profileAttributes.firstName = firstName;
      if (lastName) profileAttributes.lastName = lastName;
      if (organization) profileAttributes.organization = organization;
      if (title) profileAttributes.title = title;
      if (locale) profileAttributes.locale = locale;
      if (location) {
        profileAttributes.location = {
          address1: location.address1,
          address2: location.address2,
          city: location.city,
          country: location.country,
          region: location.region,
          zip: location.zip,
        };
      }
      if (customProperties) {
        const parsedProperties = parseJsonSafely(customProperties);
        if (parsedProperties) {
          profileAttributes.properties = parsedProperties;
        }
      }

      const profileQuery: ProfileCreateQuery = {
        data: {
          type: "profile",
          attributes: profileAttributes,
        },
      };

      const result = await profilesApi.createProfile(profileQuery);

      const returnValue = {
        profile: formatProfileResponse(result.body.data),
      };

      logger
        .forBot()
        .debug(
          `Successfully created profile with ID: ${result.body.data.id}. Returned data:`,
          JSON.stringify(returnValue, null, 2)
        );

      return returnValue;
    } catch (error) {
      logger.forBot().error("Failed to create Klaviyo profile", error);
      throw new RuntimeError(getErrorMessage(error));
    }
  };

export const updateProfile: bp.IntegrationProps["actions"]["updateProfile"] =
  async ({ ctx, logger, input }) => {
    const {
      profileId,
      email,
      phone,
      firstName,
      lastName,
      organization,
      title,
      locale,
      location,
      customProperties,
    } = input;

    try {
      const profilesApi = getProfilesApi(ctx);

      const updatedProfileAttributes: ProfilePartialUpdateQuery["data"]["attributes"] =
        {};

      if (email) updatedProfileAttributes.email = email;
      if (phone) updatedProfileAttributes.phoneNumber = phone;
      if (firstName) updatedProfileAttributes.firstName = firstName;
      if (lastName) updatedProfileAttributes.lastName = lastName;
      if (organization) updatedProfileAttributes.organization = organization;
      if (title) updatedProfileAttributes.title = title;
      if (locale) updatedProfileAttributes.locale = locale;
      if (location) {
        updatedProfileAttributes.location = {
          address1: location.address1,
          address2: location.address2,
          city: location.city,
          country: location.country,
          region: location.region,
          zip: location.zip,
        };
      }
      if (customProperties) {
        const parsedProperties = parseJsonSafely(customProperties);
        if (parsedProperties) {
          updatedProfileAttributes.properties = parsedProperties;
        }
      }

      const updatedProfileQuery: ProfilePartialUpdateQuery = {
        data: {
          type: "profile",
          id: profileId,
          attributes: updatedProfileAttributes,
        },
      };

      const result = await profilesApi.updateProfile(
        profileId,
        updatedProfileQuery
      );

      const returnValue = {
        profile: formatProfileResponse(result.body.data),
      };

      logger
        .forBot()
        .debug(
          `Successfully updated profile with ID: ${profileId}. Returned data:`,
          JSON.stringify(returnValue, null, 2)
        );

      return returnValue;
    } catch (error) {
      logger.forBot().error("Failed to update Klaviyo profile", error);
      throw new RuntimeError(getErrorMessage(error));
    }
  };

export const getProfile: bp.IntegrationProps["actions"]["getProfile"] = async ({
  ctx,
  logger,
  input,
}) => {
  const { profileId } = input;

  try {
    const profilesApi = getProfilesApi(ctx);

    const result = await profilesApi.getProfile(profileId);

    const returnValue = {
      profile: formatProfileResponse(result.body.data),
    };

    logger
      .forBot()
      .debug(
        `Successfully retrieved profile with ID: ${profileId}. Returned data:`,
        JSON.stringify(returnValue, null, 2)
      );

    return returnValue;
  } catch (error) {
    logger.forBot().error("Failed to get Klaviyo profile", error);
    throw new RuntimeError(getErrorMessage(error));
  }
};

export const getProfiles: bp.IntegrationProps["actions"]["getProfiles"] =
  async ({ ctx, logger, input }) => {
    const { filterField, filterOperator, filterValue, pageSize, sort } = input;

    try {
      const profilesApi = getProfilesApi(ctx);

      const options: Parameters<
        ReturnType<typeof getProfilesApi>["getProfiles"]
      >[0] = {};

      if (filterField && filterOperator && filterValue) {
        options.filter = buildFilter(filterField, filterOperator, filterValue);
      }

      if (pageSize) options.pageSize = pageSize;
      if (sort) options.sort = sort;

      const result = await profilesApi.getProfiles(options);

      const profiles = formatProfilesArray(result.body.data);

      const returnValue = {
        profiles,
        totalCount: result.body.data.length,
      };

      logger
        .forBot()
        .debug(
          `Retrieved ${profiles.length} profiles from Klaviyo. Returned data:`,
          JSON.stringify(returnValue, null, 2)
        );

      return returnValue;
    } catch (error) {
      logger.forBot().error("Failed to get Klaviyo profiles", error);
      throw new RuntimeError(getErrorMessage(error));
    }
  };

export const subscribeProfiles: bp.IntegrationProps["actions"]["subscribeProfiles"] =
  async ({ ctx, logger, input }) => {
    const { profileSubscriptions, listId, historicalImport } = input;

    if (!profileSubscriptions || profileSubscriptions.length === 0) {
      throw new RuntimeError("At least one profile is required to subscribe");
    }
    if (profileSubscriptions.length > MAX_PROFILES_PER_BULK_OPERATION) {
      throw new RuntimeError(
        `You can only subscribe up to ${MAX_PROFILES_PER_BULK_OPERATION} profiles at a time`
      );
    }

    try {
      const profilesApi = getProfilesApi(ctx);

      const subscriptionProfilesData = profileSubscriptions.map(
        (profileSubscription) => {
          const subscriptionPreferences: SubscriptionChannels = {};

          if (profileSubscription.emailConsent) {
            subscriptionPreferences.email = {
              marketing: {
                consent: "SUBSCRIBED",
                consentedAt: historicalImport ? new Date() : undefined,
              },
            };
          }

          if (profileSubscription.smsConsent) {
            subscriptionPreferences.sms = {
              marketing: {
                consent: "SUBSCRIBED",
                consentedAt: historicalImport ? new Date() : undefined,
              },
            };
          }

          return {
            type: "profile" as const,
            id: profileSubscription.id,
            attributes: {
              ...(profileSubscription.email && {
                email: profileSubscription.email,
              }),
              ...(profileSubscription.phone && {
                phone_number: profileSubscription.phone,
              }),
              subscriptions: subscriptionPreferences,
            },
          };
        }
      );

      const subscribeProfilesQuery: SubscriptionCreateJobCreateQuery = {
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: { data: subscriptionProfilesData },
            historicalImport: historicalImport,
          },
          ...(listId && {
            relationships: {
              list: { data: { type: "list", id: listId } },
            },
          }),
        },
      };

      await profilesApi.bulkSubscribeProfiles(subscribeProfilesQuery);

      const returnValue = {
        success: true,
      };

      logger
        .forBot()
        .debug(
          `Successfully scheduled subscription job for ${profileSubscriptions.length} profiles. Returned data:`,
          JSON.stringify(returnValue, null, 2)
        );

      return returnValue;
    } catch (error) {
      logger.forBot().error("Failed to subscribe Klaviyo profiles", error);
      throw new RuntimeError(getErrorMessage(error));
    }
  };
