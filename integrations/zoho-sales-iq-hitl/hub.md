# **Zoho SalesIQ HITL (Human-in-the-Loop) Integration**

This integration allows Botpress to **seamlessly escalate conversations** from a chatbot to a live agent in **Zoho SalesIQ**. When a user requests human assistance, the bot initiates a **new conversation** in Zoho SalesIQ and enables real-time communication between the user and a human agent.

### **How It Works**

1. **Conversation Start**:
   - When a user requests live agent support, the bot calls **Zoho SalesIQ's Open Conversation API** to create a new session.
   - The **Botpress HITL interface** keeps track of the conversation ID.

2. **Message Handling**:
   - User messages are forwarded to the **Zoho SalesIQ Send Message API**, allowing the visitor to communicate with the assigned agent.

3. **Operator Events Tracking**:
   - The integration listens for **Zoho SalesIQ webhook events**, such as:
     - **Agent Assignment (`operatorAssignedUpdate`)**
     - **Conversation Resolved (`operatorConversationComplete`)**
     - **Missed Conversations (`operatorConversationMissed`)**
     - **Agent Messages (`operatorSendMessage`)**

4. **Closing Conversations**:
   - Once an agent **resolves the conversation**, Botpress will update the session and notify the chatbot.

---

# Zoho SalesIQ Integration Setup Guide

### **[Loom video walk through setting up the OAuth configuration.](https://www.loom.com/share/d3c758e372e54a32b4f29d7da44af1ce?sid=38c81c81-486e-4a48-bfb1-941b02d052d1)** ###

## Step 1: Create a Zoho Developer Account

1. Open the Zoho API Console:  
   [https://api-console.zohocloud.ca/add?client_type=ORG](https://api-console.zohocloud.ca/add?client_type=ORG)
2. Sign in or create a Zoho Developer account if needed.
3. Create a new OAuth client.
4. Set the **Redirect URI** to your **Botpress webhook URL**.

## Step 2: Generate an Authorization Code

Ensure you use the **correct region URL** for OAuth authentication.

#### **Zoho Accounts Domains:**
| Region         | Accounts URL                       |
|---------------|----------------------------------|
| US           | `https://accounts.zoho.com`     |
| AU           | `https://accounts.zoho.com.au`  |
| EU           | `https://accounts.zoho.eu`      |
| IN           | `https://accounts.zoho.in`      |
| CN           | `https://accounts.zoho.com.cn`  |
| JP           | `https://accounts.zoho.jp`      |
| SA (Saudi Arabia) | `https://accounts.zoho.sa` |
| CA (Canada)  | `https://accounts.zohocloud.ca` |

Construct the following authorization URL, replacing placeholders with your actual values:

```text
https://accounts.zohocloud.ca/oauth/v2/org/auth?response_type=code
&client_id=YOUR_CLIENT_ID
&scope=SalesIQ.Conversations.ALL,SalesIQ.apps.read
&redirect_uri=YOUR_REDIRECT_URI
&access_type=offline
&state=123
```

- Replace `YOUR_CLIENT_ID` with your **Zoho Client ID**.
- Replace `YOUR_REDIRECT_URL` with your **Botpress webhook URL**.
- Ensure the scope is set to `SalesIQ.Conversations.ALL`.

### Get Authorization Code

1. Open the modified URL in a browser.
2. Click **Accept** when prompted.
3. Copy the **authorization code** from the redirected URL, which will look something like:

   ```text
   https://webhook.botpress.cloud/2fca97ae-3078-4287-87a2-957e7f68157a?state=123&code=1005.4e8ee2431c3713671170956c8f8ed585.8ac5720917a810e6d447df63d2b63aef&location=ca&accounts-server=https%3A%2F%2Faccounts.zohocloud.ca
   ```
   
4. The `code` parameter (`1005.4e8ee2431c...`) is your **authorization code**.

## Step 3: Exchange Authorization Code for Access Token

Run the following cURL command, replacing placeholders with your actual credentials:

```sh
curl -X POST "ACCOUNTS_URL_REGION/oauth/v2/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "code=YOUR_CODE" \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     -d "scope=SalesIQ.Conversations.ALL,SalesIQ.apps.read"
```

- Replace `YOUR_CODE` with the **authorization code** from Step 2.
- Replace `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, and `YOUR_REDIRECT_URL` with your actual values.

## Step 4: Store Credentials in Your Integration

After making the request, you will receive a response containing an **access token** and a **refresh token**. Store the following credentials in your integration configuration:

- **Client ID**
- **Client Secret**
- **Access Token**
- **Refresh Token**

## Step 5: Retrieve Required Zoho IDs

To fully integrate with **Zoho SalesIQ**, you need to gather the following details:

### 1. Get Your Screen Name

- Visit your **Zoho SalesIQ Home Page**.
  [https://salesiq.zohocloud.ca/](https://salesiq.zohocloud.ca/)
- Your **Screen Name** is displayed on this page in the URL at the top of your browser, for example, envyroinc is the screen name here https://salesiq.zohocloud.ca/envyroinc/mychats.

### 2. Get Your Department ID

1. Go to **Settings > Departments** in **Zoho SalesIQ**.
2. Click on the correct department.
3. The **Department ID** is in the URL:
   
   ```text
   https://salesiq.zohocloud.ca/envyroinc/settings/departments/edit/6338000000002024
   ```
   
   - Example **Department ID**: `6338000000002024`

### 3. Get Your App ID

1. Go to **Settings > Brands** in **Zoho SalesIQ**.
2. Click on the correct brand.
3. The **App ID** is in the URL:
   
   ```text
   https://salesiq.zohocloud.ca/envyroinc/settings/brands/6338000000002238
   ```
   
   - Example **App ID**: `6338000000002238`

## Step 6: Final Integration Configuration Setup

Enter the following details into your integration configuration:

✅ **Screen Name**  
✅ **App ID**  
✅ **Department ID**

# How to Set Up a Webhook in SalesIQ for Botpress

Follow these steps to integrate your SalesIQ account with Botpress using webhooks.

## Step 1: Navigate to Webhooks in SalesIQ
1. **Log in** to your SalesIQ account.
2. Click on **Settings** in the sidebar.
3. Scroll down and select **Webhooks**.

## Step 2: Add a New Webhook
4. Click **Add a New Data Modifications Webhook**.
5. Select the **correct brand/organization** for which you want to configure the webhook.

## Step 3: Configure the Webhook
6. In the **URL to be invoked** field, **copy and paste** your Botpress webhook URL.

## Step 4: Select Webhook Events
7. Check the following events to be associated with the webhook:
   - `conversation.attender.updated`
   - `conversation.missed`
   - `conversation.operator.replied`
   - `conversation.completed`

## Step 5: Save Your Webhook
8. Click the **Create Webhook** button to finalize your webhook setup.

**That's it!** Your webhook is now configured to send SalesIQ events to Botpress.


