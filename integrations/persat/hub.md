# Persat Integration

The Persat integration connects your Botpress chatbot with Persat, a client management and digital forms platform. With this integration, your bot can create and update client records, retrieve client information, and submit digital forms on behalf of clients. Manage your customer database and collect structured data through automated form submissions.

## What you can do

- Retrieve client information by ID
- Create new clients with full details
- Update existing client information
- Submit digital forms for clients

## Get started

1. Install the integration
2. Enter your Persat API key (Developer API token)
3. Save configuration

## Actions

### getClient

- Input: uid_client (the unique client identifier)
- Output: the complete client record including all fields and custom fields

### createClient

- Input: uid_client (required, must be unique) and company_name (required)
- Optional fields: company_description, street, street_nbr, neighborhood, city, country, latitude, longitude, service_time, wt (working hours), type_id, group_id, custom_fields
- Custom fields should be provided as JSON text (for example: `{"industry":"Retail","priority":"High"}`)
- Working hours (wt) must be exactly 2 numbers representing opening and closing times in minutes from midnight (for example: `[540, 1020]` for 9 AM to 5 PM)
- Output: the created client's complete record

### updateClient

- Input: uid_client (required) and any fields you want to update
- You can update any combination of fields including custom fields
- Custom fields should be provided as JSON text just like in createClient
- Output: the updated client record with modified fields

### submitForm

- Input: uid_client (required), schema_id (the form template ID, required), and formvalues (optional)
- Form values should be provided as JSON text using widget titles as keys (for example: `{"Customer Satisfaction":"Excellent","Comments":"Great service!"}`)
- The integration automatically maps widget titles to their IDs
- Output: the form submission record including submission ID, creation timestamp, client details, form data, and submission state
