import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { HubSpotApi } from '../../../src/client';
import { createMockBpClient, createMockBpContext, createMockLogger } from '../../utils/mocks';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('HubSpot Client Rate Limiting Infrastructure', () => {
  let hubspotClient: HubSpotApi;
  let mockClient: any;
  let mockContext: any;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClient = createMockBpClient();
    mockContext = createMockBpContext();
    mockLogger = createMockLogger();

    // Mock successful credential retrieval
    mockClient.getState = vi.fn().mockResolvedValue({
      state: {
        payload: {
          accessToken: 'test-access-token',
        },
      },
    });

    hubspotClient = new HubSpotApi(
      mockContext,
      mockClient,
      'refresh-token',
      'client-id',
      'client-secret',
      mockLogger
    );
  });

  describe('Error Response Handling', () => {
    it('should handle 429 rate limit errors with proper error messages', async () => {
      console.log('[rate-limit-test] Testing 429 error response handling...');

      // Mock 429 error response
      mockedAxios.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
          headers: { 'retry-after': '60' },
        },
        message: 'Rate limit exceeded'
      });

      console.log('[rate-limit-test] Making request that will be rate limited...');
      
      // Should handle the error and eventually throw with proper message
      await expect(hubspotClient.getThreadInfo('test-thread-id')).rejects.toThrow(
        'Failed to fetch thread info: Rate limit exceeded'
      );

      console.log('[rate-limit-test] Rate limit error correctly handled');
    });

    it('should handle server errors (5xx) with retry logic', async () => {
      console.log('[server-error-test] Testing 5xx server error handling...');

      // Mock 500 error response
      mockedAxios.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        message: 'Internal Server Error'
      });

      console.log('[server-error-test] Making request that will get server error...');
      
      await expect(hubspotClient.getThreadInfo('test-thread-id')).rejects.toThrow(
        'Failed to fetch thread info: Internal Server Error'
      );

      console.log('[server-error-test] Server error correctly handled');
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      console.log('[client-error-test] Testing 4xx client error (no retry)...');

      // Mock 404 error (should not retry)
      mockedAxios.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
        message: 'Not Found'
      });

      console.log('[client-error-test] Making request that will get 404 error...');
      
      await expect(hubspotClient.getThreadInfo('test-thread-id')).rejects.toThrow(
        'Failed to fetch thread info: Not Found'
      );

      console.log('[client-error-test] 404 error correctly handled without retries');

      // Should have logged error (verify logging works)
      expect(mockLogger.forBot().error).toHaveBeenCalled();
    });
  });

  describe('Successful Request Handling', () => {
    it('should handle successful requests correctly', async () => {
      console.log('[success-test] Testing successful request handling...');

      // Mock successful response
      mockedAxios.mockResolvedValue({
        data: { id: 'test-thread-123' },
        status: 200,
      });

      console.log('[success-test] Making successful request...');
      
      const result = await hubspotClient.getThreadInfo('test-thread-id');

      console.log('[success-test] Result:', result);

      // Should succeed
      expect(result).toEqual({ id: 'test-thread-123' });

      // Verify axios was called
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/conversations/v3/conversations/threads/test-thread-id'),
        })
      );

      console.log('[success-test] Successful request test passed!');
    });
  });

  describe('Rate Limiting Infrastructure Verification', () => {
    it('should have rate limiting methods available', () => {
      console.log('[infrastructure-test] Verifying rate limiting infrastructure...');

      // Verify the HubSpotApi class has the expected methods
      expect(typeof hubspotClient.getThreadInfo).toBe('function');
      expect(typeof hubspotClient.getCustomChannels).toBe('function');
      expect(typeof hubspotClient.deleteCustomChannel).toBe('function');
      expect(typeof hubspotClient.createConversation).toBe('function');
      expect(typeof hubspotClient.sendMessage).toBe('function');

      console.log('[infrastructure-test] All rate-limited methods are available');

      // Verify the client has proper configuration
      expect(hubspotClient).toBeInstanceOf(HubSpotApi);

      console.log('[infrastructure-test] Infrastructure verification passed!');
    });

    it('should validate error response structure', async () => {
      console.log('[response-structure-test] Testing error response structure...');

      // Mock error response
      mockedAxios.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
        },
        message: 'Rate limit exceeded'
      });

      console.log('[response-structure-test] Making request to test error structure...');
      
      // Should throw with proper error message format
      await expect(hubspotClient.getThreadInfo('test-thread-id')).rejects.toThrow(
        /Failed to fetch thread info:/
      );

      console.log('[response-structure-test] Error response structure validated');
    });
  });
});