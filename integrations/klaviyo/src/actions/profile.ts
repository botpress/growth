import { RuntimeError } from "@botpress/sdk";
import {
  ProfileCreateQuery,
  ProfilePartialUpdateQuery,
  ProfileEnum,
  SubscriptionCreateJobCreateQuery,
  ProfileSubscriptionBulkCreateJobEnum,
} from "klaviyo-api";
import { getProfilesApi } from "../auth";
import { MAX_PROFILES_PER_BULK_OPERATION } from "../misc/constants";
import { getErrorMessage } from "../misc/error-handler";
import { ProfileSubscriptions, GetProfilesOptions } from "../misc/types";
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
          type: ProfileEnum.Profile,
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
          type: ProfileEnum.Profile,
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

  if (!profileId) {
    throw new RuntimeError("Klaviyo Profile ID is required to get a profile");
  }

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

      const options: GetProfilesOptions = {};

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

      const profilesData = profileSubscriptions.map((p) => {
        const subscriptions: ProfileSubscriptions = {};

        if (p.emailConsent) {
          subscriptions.email = {
            marketing: {
              consent: "SUBSCRIBED",
              consented_at: historicalImport
                ? new Date().toISOString()
                : undefined,
            },
          };
        }

        if (p.smsConsent) {
          subscriptions.sms = {
            marketing: {
              consent: "SUBSCRIBED",
              consented_at: historicalImport
                ? new Date().toISOString()
                : undefined,
            },
          };
        }

        return {
          type: ProfileEnum.Profile,
          ...(p.id && { id: p.id }),
          attributes: {
            ...(p.email && { email: p.email }),
            ...(p.phone && { phone_number: p.phone }),
            subscriptions,
          },
        };
      });

      const subscribeProfilesQuery: SubscriptionCreateJobCreateQuery = {
        data: {
          type: ProfileSubscriptionBulkCreateJobEnum.ProfileSubscriptionBulkCreateJob,
          attributes: {
            profiles: { data: profilesData },
            ...(historicalImport !== undefined && {
              historical_import: historicalImport,
            }),
          },
          ...(listId && {
            relationships: {
              list: { data: { type: "list", id: listId } },
            },
          }),
        },
      };

      const result = await profilesApi.bulkSubscribeProfiles(
        subscribeProfilesQuery
      );

      const returnValue = {
        success: result.response.status === 202,
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
