# MailerLite Integration

The MailerLite integration connects your Botpress chatbot with MailerLite, a modern email marketing and automation platform. With this integration, your bot can add or update subscribers, find people by email or ID, and get notified when someone new joins your list. You can also include extra details using custom fields so your audience stays organized and up to date.

## What you can do

- Find a subscriber by email or ID
- Add or update a subscriber
- Delete a subscriber
- Get notified when someone new subscribes

## Get started

1. Install the integration
2. Enter your MailerLite API key
3. Save configuration

## Actions

### fetchSubscriber

- Input: email or ID (give at least one)
- Output: the subscriber’s details if found; otherwise nothing

### upsertSubscriber

- Input: email (required) and any details you want to save (name, last name, company, country, city, phone, state, ZIP)
- You can also add extra custom fields by sending them as JSON text under "customFields" (for example: `{"favorite_color":"blue"}`).
- Output: the saved subscriber’s details

### deleteSubscriber

- Input: subscriber ID
- Output: a simple success message

## Events

- subscriberCreated: notifies your bot when someone new subscribes
