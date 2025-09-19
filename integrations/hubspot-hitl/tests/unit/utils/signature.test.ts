import { describe, it, expect, beforeEach } from 'vitest';
import { validateHubSpotInboxSignature } from '../../../src/utils/signature';
import { createMockLogger } from '../../utils/mocks';
import * as crypto from 'crypto';

describe('validateHubSpotInboxSignature', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  it('should return true for valid signature', () => {
    const requestBody = '{"test": "data"}';
    const timestamp = Date.now().toString();
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';

    // Generate expected signature
    const rawString = `${method}${webhookUrl}${requestBody}${timestamp}`;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(rawString);
    const expectedSignature = hmac.digest('base64');

    const result = validateHubSpotInboxSignature(
      requestBody,
      expectedSignature,
      timestamp,
      method,
      webhookUrl,
      clientSecret,
      mockLogger
    );

    expect(result).toBe(true);
  });

  it('should return false for invalid signature', () => {
    const requestBody = '{"test": "data"}';
    const timestamp = Date.now().toString();
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';
    
    // Generate a proper length signature but with different data to make it invalid
    const rawString = `${method}${webhookUrl}${'different data'}${timestamp}`;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(rawString);
    const invalidSignature = hmac.digest('base64');

    const result = validateHubSpotInboxSignature(
      requestBody,
      invalidSignature,
      timestamp,
      method,
      webhookUrl,
      clientSecret,
      mockLogger
    );

    expect(result).toBe(false);
    expect(mockLogger.forBot().error).toHaveBeenCalledWith('Invalid HubSpot Inbox webhook signature');
  });

  it('should return false for missing signature', () => {
    const requestBody = '{"test": "data"}';
    const timestamp = Date.now().toString();
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';

    const result = validateHubSpotInboxSignature(
      requestBody,
      '',
      timestamp,
      method,
      webhookUrl,
      clientSecret,
      mockLogger
    );

    expect(result).toBe(false);
    expect(mockLogger.forBot().error).toHaveBeenCalledWith('Missing required headers or client secret');
  });

  it('should return false for missing client secret', () => {
    const requestBody = '{"test": "data"}';
    const timestamp = Date.now().toString();
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const signature = 'valid-signature';

    const result = validateHubSpotInboxSignature(
      requestBody,
      signature,
      timestamp,
      method,
      webhookUrl,
      '',
      mockLogger
    );

    expect(result).toBe(false);
    expect(mockLogger.forBot().error).toHaveBeenCalledWith('Missing required headers or client secret');
  });

  it('should return false for expired timestamp', () => {
    const requestBody = '{"test": "data"}';
    const expiredTimestamp = (Date.now() - 400000).toString(); // 6+ minutes ago
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';
    const signature = 'valid-signature';

    const result = validateHubSpotInboxSignature(
      requestBody,
      signature,
      expiredTimestamp,
      method,
      webhookUrl,
      clientSecret,
      mockLogger
    );

    expect(result).toBe(false);
    expect(mockLogger.forBot().error).toHaveBeenCalledWith(
      'Timestamp is too old:',
      expect.any(Number),
      'ms'
    );
  });

  it('should return true for recent timestamp', () => {
    const requestBody = '{"test": "data"}';
    const recentTimestamp = (Date.now() - 60000).toString(); // 1 minute ago
    const method = 'POST';
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';

    // Generate valid signature for this data
    const rawString = `${method}${webhookUrl}${requestBody}${recentTimestamp}`;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(rawString);
    const validSignature = hmac.digest('base64');

    const result = validateHubSpotInboxSignature(
      requestBody,
      validSignature,
      recentTimestamp,
      method,
      webhookUrl,
      clientSecret,
      mockLogger
    );

    expect(result).toBe(true);
  });

  it('should handle different HTTP methods correctly', () => {
    const requestBody = '{"test": "data"}';
    const timestamp = Date.now().toString();
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const webhookUrl = 'https://webhook.botpress.cloud/test';
    const clientSecret = 'test-secret';

    methods.forEach(method => {
      const rawString = `${method}${webhookUrl}${requestBody}${timestamp}`;
      const hmac = crypto.createHmac('sha256', clientSecret);
      hmac.update(rawString);
      const signature = hmac.digest('base64');

      const result = validateHubSpotInboxSignature(
        requestBody,
        signature,
        timestamp,
        method,
        webhookUrl,
        clientSecret,
        mockLogger
      );

      expect(result).toBe(true);
    });
  });
});
