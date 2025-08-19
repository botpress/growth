# Salesforce Messaging HITL

## Description

This integration makes Salesforce Messaging available as a channel for Human-in-the-loop on Botpress

## Configuration on Salesforce

You need to configure your Salesforce environment to use "Messaging for In-App and Web" first, since the configuration will depend on your business and is made exclusively on Salesforce, no steps will be provided here, but here are a few resources that can help.

https://help.salesforce.com/s/articleView?id=service.miaw_setup_stages.htm

Please reach out to Salesforce regarding any question regarding the setup of "Messaging for In-App and Web"

### Configuration on Botpress

After "Messaging for In-App and Web" is working on your Salesforce instance (Make sure to test this using Salesforce tools), you will need to create a new Embedded Service Deployment on Salesforce to use to generate credentials for Botpress.

https://YOUR_COMPANY.lightning.force.com/lightning/setup/EmbeddedServiceDeployments/home

1. Create a **New deployment**
2. Select "Messaging for In-App and Web"
3. Select "Custom Client"
4. Fill the "Embedded Service Deployment Name" field and select the **Messaging channel** that you were using for your "Messaging for In-App and Web" tests
5. Save, then click on "Code Snippet" -> "Install on code snippet"
6. You will be presented with the values for the properties below, copy them and fill on the configuration fields on Botpress for this Integration

- **OrganizationId**
- **DeveloperName**
- **Url** -> **Endpoint**

After setting both the Configuration Fields on Botpress, you can click on **Save Configuration** on Botpress.

## Using the Integration

This Integration uses the **HITL Interface**, so you can use the [HITL Agent](https://botpress.com/docs/hitl-agent) to set your bot for **HITL**

[YouTube tutorial](https://www.youtube.com/watch?v=AAkARl8_cTo)
