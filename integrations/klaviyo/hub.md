# Klaviyo Integration

The Klaviyo integration allows you to connect your Botpress chatbot with Klaviyo, a leading customer data and marketing automation platform. With this integration, your chatbot can create leads, update customer information, and subscribe profiles to SMS and Email marketing.

## Available Actions

### Create Profile

Create a new customer profile in Klaviyo. This action allows you to add new contacts to your Klaviyo database with comprehensive profile information.

**Required Fields:**

- Either **email address** OR **phone number** (in E.164 format like +15005550006)

**Optional Fields:**

- **First name** and **last name**
- **Organization** and **job title**
- **Locale** (in IETF BCP 47 format like en-US, fr-FR)
- **Location** (address details including address lines, city, country, region, ZIP code)
- **Custom properties** (key-value pairs for storing additional profile data)

**Output:** Returns the created profile with its unique Klaviyo ID.

### Update Profile

Update an existing customer profile in Klaviyo using the profile's unique ID. This action allows you to modify any profile information after creation.

**Required Fields:**

- **Profile ID** (the unique Klaviyo identifier of the profile to update)

**Optional Fields:**

- **Email address** (updates the profile's email)
- **Phone number** (in E.164 format)
- **First name** and **last name**
- **Organization** and **job title**
- **Locale** (in IETF BCP 47 format)
- **Location** (complete address information)
- **Custom properties** (key-value pairs)

**Output:** Returns the updated profile with all current information.

### Get Profile

Retrieve a specific customer profile from Klaviyo using its unique ID. This action is useful for looking up individual customer information.

**Required Fields:**

- **Profile ID** (the unique Klaviyo identifier of the profile to retrieve)

**Output:** Returns the complete profile information including ID, email, phone, name, and all other stored data.

### Get Profiles

Search and retrieve multiple customer profiles from Klaviyo using filters and sorting options. This action is perfect for finding groups of customers based on specific criteria.

**Filter Options:**

- **Filter Field:** Choose from `id`, `email`, `phone_number`, `external_id`, `created`, or `updated`
- **Filter Operator:** Use comparison operators like `equals`, `contains`, `greater-than`, `less-than`, `starts-with`, `ends-with`
- **Filter Value:** The value to search for (supports strings and dates)

**Pagination & Sorting:**

- **Page Size:** Number of profiles to return (1-100, default: 20)
- **Sort:** Sort by any field with optional descending order (prefix with `-`)

**Example Use Cases:**

- Find all profiles created after a specific date
- Search for profiles with email addresses containing a domain
- Get profiles sorted by creation date (newest first)

**Output:** Returns an array of profiles matching your criteria.

### Subscribe Profiles

Subscribe multiple customer profiles to email and/or SMS marketing lists in Klaviyo. This action processes subscriptions asynchronously and can handle up to 1,000 profiles at once.

**Required Fields:**

- **Profile Subscriptions:** Array of profiles with consent information
  - **Profile ID** (or email/phone for identification)
  - **Email Consent:** Boolean indicating consent for email marketing
  - **SMS Consent:** Boolean indicating consent for SMS marketing

**Optional Fields:**

- **List ID:** Specific Klaviyo list to add subscribed profiles to
- **Historical Import:** Boolean to import historical profiles

**Important Notes:**

- Maximum 1,000 profiles per request
- At least one profile is required
- Consent flags determine which marketing channels the profile will be subscribed to
- The operation is processed asynchronously by Klaviyo

**Output:** Returns a success boolean indicating whether the subscription job was scheduled successfully.
