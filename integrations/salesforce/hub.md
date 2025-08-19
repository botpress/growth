The Salesforce Leads integration allows you search, create, update, and delete Salesforce contacts in your bot

[![image](https://i.imgur.com/v5l26vi.png)](https://youtu.be/fPORGBUJmG0?si=uZLh40GSFbmGpPZE)

## Integration Setup

1. Toggle on the "Enable Integration" option and click "Save."
2. Open the Webhook URL in your browser and follow the on-screen instructions to complete the installation process.
3. Toggle on the "Sandbox Environment" option if you wish to switch to Salesforce's Sandbox environment. Whenever you change the environment (from Production to Sandbox or vice versa), you must reauthorize the connection by repeating the installation process described in Step 2.

## How-To

[![image](https://i.imgur.com/UcgcWJf.png)](https://youtu.be/lszZsLIXNf8?si=Vm20mCzUQyLiOoQm)

## Make API request

1. **Make API Request** action acting as a proxy allowing users to make request to the Salesforce API.
2. Pass valid HTTP method, URL path ("yourinstance.salesforce.com/services/data/v54.0/PATH"), and additional request data if needed.

## Search Contacts

1. In Studio, add the **Search Contacts** card to your flow.
2. Pass at least one search criteria in the card input.
3. You can store the result of the action in a variable.

## Create Contact

1. In Studio, add the **Create Contact** card to your flow.
2. Pass the contact information in the card input. `First Name`, `Last Name`, `Email` fields are required.
3. You can pass custom fields in JSON format
4. You can store the `ID` of the created contact in a variable.

## Update Contact

1. In Studio, add the **Update Contact** card to your flow.
2. Pass the `ID` of the contact to be updated and the field that need to be updated
3. You can pass custom fields in JSON format
4. You can store the `ID` of the updated contact in a variable.

## Search Leads

1. In Studio, add the **Search Leads** card to your flow.
2. Pass at least one search criteria in the card input.
3. You can store the result of the action in a variable.

## Create Leads

1. In Studio, add the **Create Leads** card to your flow.
2. Pass the contact information in the card input. `First Name`, `Last Name`, `Email`, `Company` fields are required.
3. You can pass custom fields in JSON format
4. You can store the `ID` of the created contact in a variable.

## Update Leads

1. In Studio, add the **Update Leads** card to your flow.
2. Pass the `ID` of the contact to be updated and the field that need to be updated
3. You can pass custom fields in JSON format
4. You can store the `ID` of the updated contact in a variable.
