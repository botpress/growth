# Botpress Integration: Apify Website Content Crawler

## **Apify API Integration Guide** ##

For further details, refer to the [**Apify API documentation**](https://docs.apify.com/api/v2).

## **Step 1: Get Your Apify API Token**

1. Go to [Apify Console](https://console.apify.com/).
2. Sign in to your account (or create one if you haven't already).
3. Navigate to **"Account Settings"** → **"Integrations"**.
4. Copy your **API Token** (starts with `apify_api_`).

## **Step 2: Configure the Integration**

1. In Botpress, go to your bot's **Integrations** section.
2. Find and enable the **Apify** integration.
3. Enter your **API Token** in the configuration.
4. Save the configuration.

## Overview
This Botpress integration allows seamless web content crawling using the **Apify Website Content Crawler**. It enables users to crawl websites, extract content, and sync the results directly to Botpress files, similar to the Notion integration.

## Features
- **Website Content Crawling:** Crawl websites and extract content using Apify's powerful crawler.
- **Content Synchronization:** Automatically sync crawled content to Botpress files.
- **Flexible Configuration:** Customize crawling parameters through UI or JSON override.
- **Authentication Support:** Crawl authenticated content using custom headers.
- **Multiple Output Formats:** Support for Markdown and HTML content extraction.

---
## API Functions & Usage
Below are the available actions in this integration:

### 1️⃣ **Website Content Crawler**

#### **Crawl Website Content**
- **Description:** Crawls websites and extracts content using Apify's Website Content Crawler.
- **Method:** `POST /acts/apify~website-content-crawler/runs`
- **Input Parameters:**

  **Required:**
  ```json
  {
    "startUrls": ["https://example.com"],
    "syncTargetPath": "/crawled-content"
  }
  ```

  **Optional Configuration (Individual Parameters):**
  ```json
  {
    "startUrls": ["https://example.com"],
    "excludeUrlGlobs": ["**/admin/**", "**/private/**"],
    "includeUrlGlobs": ["**/*.html", "**/blog/**"],
    "maxCrawlPages": 100,
    "saveMarkdown": true,
    "htmlTransformer": "readableTextIfPossible",
    "removeElementsCssSelector": ".ads, .sidebar, .footer",
    "crawlerType": "playwright:firefox",
    "expandClickableElements": true,
    "headers": {
      "Authorization": "Bearer your-token",
      "User-Agent": "Custom Botpress Crawler"
    }
  }
  ```

  **Alternative: Full JSON Override:**
  ```json
  {
    "startUrls": ["https://example.com"],
    "rawInputJsonOverride": "{\"maxCrawlPages\": 500, \"customOption\": \"value\", \"additionalCrawlerSettings\": {\"timeout\": 30000}}"
  }
  ```

- **Output:**
  ```json
  {
    "success": true,
    "message": "Website content crawled successfully",
    "data": {
      "runId": "abc123",
      "datasetId": "def456",
      "filesCreated": 15,
      "syncTargetPath": "/crawled-content"
    }
  }
  ```

---
## Configuration Parameters

### **Core Crawling Parameters**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startUrls` | Array | URLs to start crawling from | Required |
| `excludeUrlGlobs` | Array | URL patterns to exclude from crawling | `[]` |
| `includeGlobs` | Array | URL patterns to include in crawling | `["**/*"]` |
| `maxPages` | Number | Maximum number of pages to crawl | `1000` |
| `crawlerType` | String | Browser type: `playwright`, `puppeteer` | `playwright` |

### **Content Processing Parameters**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `saveMarkdown` | Boolean | Save content as Markdown format | `true` |
| `htmlTransformer` | String | HTML processing: `readable`, `minimal`, `none` | `readable` |
| `removeElementsCssSelector` | String | CSS selectors for elements to remove | `""` |
| `expandClickableElements` | Boolean | Expand clickable elements for better content extraction | `false` |

### **File Synchronization**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `syncTargetPath` | String | Botpress file path where content will be saved | Required |

### **Advanced Configuration**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `headers` | Object | Custom HTTP headers for authentication/requests | `{}` |
| `rawInputJsonOverride` | Object | JSON object to override any crawler parameters | `{}` |

---
## Webhook Configuration

To enable automatic content synchronization when crawler runs complete, you need to configure a webhook in Apify. Follow these steps:

1. Go to the [Website Content Crawler](https://apify.com/apify/website-content-crawler) actor page
2. Click on the **"Integrations"** tab
3. Click **"Generic HTTP request"** to create a new webhook integration
4. Configure the webhook with the following settings:

### **Trigger Conditions**
Set the webhook to trigger on these events:
- Run succeeded
- Run created  
- Run failed
- Run timed out
- Run resurrected
- Run aborted

### **Webhook URL**
Use your Botpress webhook URL:
```
https://webhook.botpress.cloud/YOUR-WEBHOOK-ID
```

### **Payload Template**
Use this JSON payload template:
```json
{
  "userId": {{userId}},
  "createdAt": {{createdAt}},
  "eventType": {{eventType}},
  "eventData": {{eventData}},
  "resource": {{resource}}
}
```

### **Headers Template**
Add this header for security:
```json
{
  "X-Botpress-Webhook-Secret": "YOUR-SECRET-KEY"
}
```

**Note**: Replace `YOUR-WEBHOOK-ID` with your actual Botpress webhook ID and `YOUR-SECRET-KEY` with a secure secret key that matches your Botpress webhook configuration.

---
## Examples

### **Basic Website Crawling**
```json
{
  "startUrls": ["https://blog.example.com"],
  "syncTargetPath": "/blog-content",
  "maxPages": 50,
  "saveMarkdown": true
}
```

### **Authenticated Content Crawling**
```json
{
  "startUrls": ["https://private.example.com"],
  "syncTargetPath": "/private-content",
  "headers": {
    "Authorization": "Bearer your-access-token",
    "Cookie": "session=abc123"
  },
  "excludeUrlGlobs": ["**/admin/**"],
  "maxPages": 200
}
```

### **Advanced Content Processing**
```json
{
  "startUrls": ["https://docs.example.com"],
  "syncTargetPath": "/documentation",
  "includeGlobs": ["**/docs/**", "**/api/**"],
  "removeElementsCssSelector": ".navigation, .sidebar, .ads",
  "htmlTransformer": "readable",
  "expandClickableElements": true,
  "saveMarkdown": true
}
```

---
## File Synchronization

The integration automatically syncs crawled content to Botpress files using the specified `syncTargetPath`. Files are created with the following structure:

```
/syncTargetPath/
├── page-1.md
├── page-2.md
├── page-3.md
└── ...
```

Each file contains the extracted content from a crawled page, formatted according to your configuration (Markdown or HTML).

---
## Notes
- The integration uses Apify's [Website Content Crawler](https://apify.com/apify/website-content-crawler) specifically.
- API responses are standardized to include `success`, `message`, and `data`.
- Content is automatically synced to Botpress files.
- Custom headers allow crawling of authenticated content.
- The `rawInputJsonOverride` parameter provides full flexibility for advanced crawler configurations. When provided, it completely replaces the individual parameter approach, giving you full control over the crawler input.

For further details, refer to the [**Apify Website Content Crawler documentation**](https://apify.com/apify/website-content-crawler).

