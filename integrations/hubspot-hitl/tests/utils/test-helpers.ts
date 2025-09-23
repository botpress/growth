import axios from 'axios'

/**
 * Test utilities for e2e tests
 */
export class TestHelpers {
  /**
   * Wait for a condition to be true with timeout
   */
  static async waitFor(
    condition: () => Promise<boolean> | boolean,
    timeoutMs: number = 10000,
    intervalMs: number = 100
  ): Promise<void> {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      if (await condition()) {
        return
      }
      await this.sleep(intervalMs)
    }

    throw new Error(`Condition not met within ${timeoutMs}ms`)
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Generate a random test identifier
   */
  static generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate environment variables for e2e tests
   */
  static validateE2EEnvironment(): void {
    const requiredVars = [
      'HUBSPOT_REFRESH_TOKEN',
      'HUBSPOT_CLIENT_ID',
      'HUBSPOT_CLIENT_SECRET',
      'HUBSPOT_DEVELOPER_API_KEY',
      'HUBSPOT_APP_ID',
      'HUBSPOT_INBOX_ID',
    ]

    const missing = requiredVars.filter((v) => !process.env[v])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for e2e tests: ${missing.join(', ')}`)
    }
  }

  /**
   * Check if HubSpot API is accessible
   */
  static async checkHubSpotConnectivity(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/validate', {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        },
        timeout: 5000,
      })
      return response.status === 200
    } catch {
      return false
    }
  }

  /**
   * Clean up test data from HubSpot (if needed)
   */
  static async cleanupTestData(testId: string): Promise<void> {
    // Implementation depends on specific cleanup needs
    console.log(`Cleaning up test data for: ${testId}`)
  }

  /**
   * Delete a HubSpot custom channel for cleanup with retry logic
   */
  static async deleteCustomChannel(channelId: string): Promise<boolean> {
    const maxRetries = 3

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.delete(`https://api.hubapi.com/conversations/v3/custom-channels/${channelId}`, {
          params: {
            hapikey: process.env.HUBSPOT_DEVELOPER_API_KEY,
            appId: process.env.HUBSPOT_APP_ID,
          },
          timeout: 30000,
        })

        console.log(`Successfully deleted channel: ${channelId}`)
        return response.status === 204 || response.status === 200
      } catch (error: any) {
        // Check if we should retry
        const isRetryableError =
          error.response?.status === 429 ||
          error.response?.status >= 500 ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT'

        if (attempt < maxRetries && isRetryableError) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000) // Exponential backoff, max 8s
          console.warn(`Delete channel ${channelId} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`)
          await this.sleep(delay)
          continue
        }

        console.warn(`Failed to delete channel ${channelId} (final attempt):`, error.response?.data || error.message)
        return false
      }
    }

    return false
  }
}
