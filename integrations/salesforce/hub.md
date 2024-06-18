The Salesforce Contacts integration allows you search, create, update, and delete Salesforce contacts in your bot

## Integration Setup

1. Enable the integration in your settings.
2. Save your configuration to preserve the changes.
3. Open the Webhook URL in your browser and follow the on-screen instructions to complete the installation process.

## Search Contacts

1. In Studio, add the **Search Contacts** card to your flow.
2. Pass at least one search criteria in the card input.
3. You can store the result of the action in a variable.

## Create Contact

1. In Studio, add the **Create Contact** card to your flow.
2. Pass the contact information in the card input. `First Name`, `Last Name`, `Email` fields are required.
3. You can store the `Id` of the created contact in a variable.

## Update Contact

1. In Studio, add the **Update Contact** card to your flow.
2. Pass the `Id` of the contact to be updated and the field that need to be updated
3. You can store the `Id` of the updated contact in a variable.

## Delete Contact

1. In Studio, add the **Delete Contact** card to your flow.
2. Pass the `Id` of the contact to be deleted.
3. You can store the `Id` of the deleted contact in a variable.
