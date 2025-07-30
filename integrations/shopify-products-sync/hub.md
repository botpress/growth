# Shopify Products Sync Integration

Connect your Shopify store to Botpress to sync products into your Botpress Knowledge Base (KB) and/or Botpress tables, with real-time updates via Shopify webhooks.

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
3. Enter the **Knowledge Base ID** where products should be synced (optional if only using table sync).
4. Set the **Row Storage Factor** (optional, default: 1):
   - Every table has a row factor that determines the storage limit for each of its rows
   - The default row factor is 1, allowing up to 4KB of data per row
   - Increase this value if you need more storage per product
5. Click **Save**.

## What Happens on Registration?

- Webhooks are set up in Shopify for product creation, update, and deletion events.
- When a product is created, updated, or deleted in Shopify, the corresponding data is updated in your configured destinations (KB and/or table), and Botpress events are emitted.

## Sync Options

This integration provides two sync methods:

### 1. Knowledge Base Sync

- Products are synced to your selected Botpress Knowledge Base (KB) as articles
- Each product becomes a searchable article in your KB
- Perfect for chatbot knowledge and product discovery

### 2. Table Sync

- Products are synced to a Botpress table called `shopify_products_Table`
- Provides structured data access for advanced use cases
- Enables complex queries and data manipulation

## Data Synced to Botpress

### Knowledge Base Articles

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

### Table Structure

The `shopify_products_Table` contains the following columns:

- `product_id` (Shopify product ID)
- `url` (product URL in store)
- `aggregate` (searchable JSON string containing all product data including name, sku, price, weight, type, brand_name, categories, availability, is_visible, description, and image_url)

## Available Actions

### Sync Products to Table

- **Action**: `syncProducts`
- **Description**: Get all products from Shopify and sync them to a Botpress table
- **Input**: Optional `rowStorageFactor` (default: 1)
- **Output**: Success status, message, and products count

### Sync Products to Knowledge Base

- **Action**: `syncKb`
- **Description**: Sync products from Shopify to Botpress Knowledge Base
- **Input**: `knowledgeBaseId` (required)
- **Output**: Success status, message, and products count

## Webhooks and Real-Time Updates

- The integration automatically sets up webhooks for product create, update, and delete events
- When a product is created, updated, or deleted in Shopify:
  - The corresponding article in your KB is created, updated, or deleted
  - The corresponding row in the table is created, updated, or deleted
  - Botpress events are emitted: `productCreated`, `productUpdated`, `productDeleted`

## Manual Sync

You can manually trigger sync operations:

- Use the `syncProducts` action to re-sync all products to the table
- Use the `syncKb` action to re-sync all products to the Knowledge Base
- These actions can be triggered from Botpress Studio or via automation

## Events

The integration emits the following events:

- `productCreated`: When a new product is created in Shopify
- `productUpdated`: When an existing product is updated in Shopify
- `productDeleted`: When a product is deleted from Shopify

Each event contains the full product data payload.

## Uninstalling / Cleanup

When you uninstall or unregister the integration, all webhooks created for your store by this integration will be removed automatically.

## Troubleshooting

- **Shop Domain:** Make sure you use your original Shopify domain (e.g., `yourstoreId.myshopify.com`), not a custom domain. You can find this in your Shopify admin URL: `admin.shopify.com/store/{thisId}`.
- Ensure your Admin API Access Token has the correct permissions (Products: Read access).
- The Shop Domain should be in the format `yourstoreId.myshopify.com` (no protocol, no trailing slash).
- If you encounter errors during sync, check your API credentials and permissions.
- For table sync issues, verify that the `rowStorageFactor` is appropriate for your product data size.

## Support

For further assistance, please refer to the Botpress documentation or contact support.
