# Pipedrive Integration

The Pipedrive integration allows you to manage contacts, deals, leads, activities, and notes directly from your chatbot. This integration provides comprehensive CRM functionality to help you track and manage your sales pipeline.

## Integration Setup

1. Toggle on the "Enable Integration" option and click "Save."
2. Enter your Pipedrive API Key in the configuration section.
3. To get your API key, go to Pipedrive Settings > Personal preferences > API > Your personal API token.

## How-To

### Person Management

#### Find Person
1. In Studio, add the **Find Person** card to your flow.
2. Enter a search term (minimum 2 characters) to search for persons.
3. Optionally specify which fields to search in (name, email, phone, notes, custom_fields).
4. You can store the search results in a variable.

#### Create Person
1. In Studio, add the **Create Person** card to your flow.
2. Enter the person's name (required).
3. Optionally add email, phone, organization ID, owner ID, and visibility settings.
4. You can store the created person's ID in a variable.

#### Update Person
1. In Studio, add the **Update Person** card to your flow.
2. Enter the person ID to update.
3. Specify the fields you want to update (name, email, phone, organization, owner, visibility).
4. You can store the updated person's data in a variable.

### Deal Management

#### Create Deal
1. In Studio, add the **Create Deal** card to your flow.
2. Enter the deal title (required).
3. Optionally add value, currency, person ID, organization ID, pipeline ID, stage ID, and expected close date.
4. You can store the created deal's ID in a variable.

#### Update Deal
1. In Studio, add the **Update Deal** card to your flow.
2. Enter the deal ID to update.
3. Specify the fields you want to update (title, value, currency, person, organization, stage, close date).
4. You can store the updated deal's data in a variable.

#### Find Deal
1. In Studio, add the **Find Deal** card to your flow.
2. Enter a search term to find deals.
3. Optionally specify which fields to search in (title, notes, custom_fields).
4. You can filter by person ID or organization ID.
5. You can store the search results in a variable.

### Lead Management

#### Create Lead
1. In Studio, add the **Create Lead** card to your flow.
2. Enter the lead name (required).
3. Optionally add owner ID, person ID, organization ID, value (amount and currency), expected close date, and visibility.
4. You can store the created lead's ID in a variable.

#### Update Lead
1. In Studio, add the **Update Lead** card to your flow.
2. Enter the lead ID to update.
3. Specify the fields you want to update (name, owner, person, organization, value, close date, visibility).
4. You can store the updated lead's data in a variable.

#### Find Lead
1. In Studio, add the **Find Lead** card to your flow.
2. Enter a search term to find leads.
3. Optionally specify which fields to search in (title, notes, custom_fields).
4. You can filter by person ID or organization ID.
5. You can store the search results in a variable.

### Activity Management

#### Create Activity
1. In Studio, add the **Create Activity** card to your flow.
2. Enter the activity details:
   - Subject (optional)
   - Type: Call, Meeting, Task, Deadline, Email, or Lunch
   - Due date (YYYY-MM-DD format)
   - Due time (HH:MM in UTC)
   - Duration (HH:MM format)
   - Location and location details
   - Public description and notes
3. Link to deals, leads, persons, organizations, or projects as needed.
4. Add participants and attendees for calendar events.
5. You can store the created activity's ID in a variable.

#### Update Activity
1. In Studio, add the **Update Activity** card to your flow.
2. Enter the activity ID to update.
3. Specify the fields you want to update (same options as create activity).
4. You can store the updated activity's data in a variable.

### Note Management

#### Create Note
1. In Studio, add the **Create Note** card to your flow.
2. Enter the note content (required).
3. Optionally link to leads, persons, deals, organizations, projects, or users.
4. You can store the created note's ID in a variable.

## Best Practices

- Always store the returned IDs from create operations to use in subsequent update operations.
- Use exact match searches when you need precise results.
- When creating activities, ensure date formats are correct (YYYY-MM-DD for dates, HH:MM for times).
- Link related entities (persons to deals, activities to deals, etc.) to maintain data relationships.
- Use the visibility settings to control who can see the created records.

## API Key Setup

To get your Pipedrive API key:
1. Log into your Pipedrive account
2. Go to Settings > Personal preferences > API
3. Copy your personal API token
4. Paste it into the integration configuration in Botpress
