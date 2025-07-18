# Shopify Sync Integration

Connect your Shopify store to Botpress to sync products into your Botpress Knowledge Base (KB) and receive real-time updates via Shopify webhooks.

## Installation and Configuration

### Prerequisites

1. A Shopify store with products.
2. Admin API Access Token with appropriate permissions (Products: Read access).

### Getting Shopify API Credentials

1. Log in to your Shopify admin and go to **Apps**.
2. Click **Develop apps** (or **Manage private apps** if using an older store).
3. Create a new app or select an existing one.
4. Under **Configuration**, add the required Admin API scopes:
   - Products: Read access
5. Install the app to your store.
6. Copy your **Admin API Access Token**.
7. Note your **Shop Domain**:
   - **Important:** This must be your original Shopify domain, not a custom domain. It is the value you see in the URL when you visit your Shopify admin: `admin.shopify.com/store/{thisId}`. The shop domain will look like `yourstoreId.myshopify.com`.

### Setting Up the Integration

1. Enter your Shopify Shop Domain (e.g., `yourstoreId.myshopify.com`). **Do not use a custom domain.**
2. Enter your Admin API Access Token.
3. Enter the **Knowledge Base ID** where products should be synced.
4. Click **Save**.

## What Happens on Registration?

- All products from your Shopify store are synced to your selected Botpress Knowledge Base (KB) as articles.
- Webhooks are set up in Shopify for product creation, update, and deletion events.
- When a product is created, updated, or deleted in Shopify, the corresponding article in your KB is created, updated, or deleted, and a Botpress event is emitted.

## Data Synced to Botpress

For each Shopify product, the following fields are stored in the KB article:

- `id` (Shopify product ID)
- `title`
- `description` (plain text, from Shopify's `body_html`)
- `vendor`
- `tags`
- `productType` (Shopify's `product_type`)
- `price` (from the first variant)
- `weight` (from the first variant)
- `weightUnit` (from the first variant)
- `images` (array of image URLs)
- `options` (e.g., sizes, colors)
- `url` (link to the product in your store)

The full product data is also available in the event payloads.

## Webhooks and Real-Time Updates

- The integration automatically sets up webhooks for product create, update, and delete events.
- When a product is created, updated, or deleted in Shopify, the corresponding article in your KB is created, updated, or deleted.
- Botpress events are emitted: `productCreated`, `productUpdated`, `productDeleted`.

## Manual Product Sync

You can manually trigger the `syncKb` action to re-sync all products from Shopify to your Botpress Knowledge Base. This can be done from Botpress Studio or via automation.

## Uninstalling / Cleanup

When you uninstall or unregister the integration, all webhooks created for your store by this integration will be removed automatically.

## Troubleshooting

- **Shop Domain:** Make sure you use your original Shopify domain (e.g., `yourstoreId.myshopify.com`), not a custom domain. You can find this in your Shopify admin URL: `admin.shopify.com/store/{thisId}`.
- Ensure your Admin API Access Token has the correct permissions (Products: Read access).
- The Shop Domain should be in the format `yourstoreId.myshopify.com` (no protocol, no trailing slash).
- If you encounter errors during sync, check your API credentials and permissions.

## Support

For further assistance, please refer to the Botpress documentation or contact support.
