# Sharepoint Document Library Connector

## Overview
The sharepoint library connector integration allows you to setup a connector between a document library in a sharepoint site and a KB in botpress.

## Configuration
To setup the connector you need need an App registration with the correct API permissions in Microsoft Entra admin center and the following details (If you have questions regarding where to obtain this information, check out the how to's section below):
- Client ID: This is the Application (client) ID of your App registration.
- Tenant ID: This is the Directory (tenant) ID of your App registration.
- Thumbprint: This is the thumbprint of your certificate you uploaded to your App registration.
- Private key: This is the content of your private key that you used to sign the certification. ( The content between the "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----")
- Site Name: The name of the Sharepoint site.
- Document Library Name: The name of the Document Library that you want to sync a Botpress KB with.
- KB ID: The ID of the KB that you want to store the synced Documents from the Document Library.

## How to's 
### How to register a app on Microsoft Entra admin center.
- From the Home page of Microsoft Entra admin center, Open App registrations ( This is under Applications in the Left Nav )
- Add a new registration by clicking on “+ New registration”
- Give your app an appropriate name, and click register.
- Open the App registration and take note of the following:
    - `Application (client) ID`
    - `Directory (tenant) ID`

### How to create a certificate for your app registration.
- We will be using a self signed certificate to authenticate, to create a self signed certificate run the following commands in order
- `openssl genrsa -out myPrivateKey.key 2048` → This will generate a 2048-bit private key and save it as myPrivateKey.key.
- `openssl req -new -key myPrivateKey.key -out myCertificate.csr` → This will create a CSR cert. You will be prompted to enter some information, fill as needed.
- `openssl x509 -req -days 365 -in myCertificate.csr -signkey myPrivateKey.key -out myCertificate.crt` → This will create a certificate file named myCertificate.crt that is valid for 365 days.

### How to add your certificate to your app registration.
- Navigate to the Azure portal and go to your Azure AD app registration.
- Under “Certificates & secrets,” choose “Certificates” and click “Upload certificate.”
- Upload your .crt

### How to update API permissions for your app registration. 
_(note: some of the these permissions might be excessions, todo: review and update doc.)_
- Go to “API Permissions” ( it should be under the Manage Group, in your App Registration "
- Click “Add a permissions”
- click on "Microsoft Graph".
- Select “Application permissions” as the type of permission.
- Check `Sites.FullControl.All`  , `Sites.Manage.All` , `Sites.Read.All` , `Sites.ReadWrite.All`, `Sites.Selected.All`, `Files.Read.All` and `Files.ReadWriteAll`
- Click “Add a permissions again.”
- Click the “Add a permission” button again
- Scroll till you find Sharepoint and click on it.
- Select “Application permissions” as the type of permission.
- Check `Sites.FullControl.All`  , `Sites.Manage.All` , `Sites.Read.All` , `Sites.ReadWrite.All` and `Sites.Selected.All`
- Click “Add permissions.”
- You should see All the permissions you added in the permissions list.
- Click on “Grant admin consent for <your_org_name>”