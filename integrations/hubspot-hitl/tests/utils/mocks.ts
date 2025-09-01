import { vi } from 'vitest';
import type * as bp from '../../.botpress';

/**
 * Mock Botpress Client for unit tests
 */
export const createMockBpClient = () => {
  const mockClient: Partial<bp.Client> = {
    getState: vi.fn(),
    setState: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    getOrCreateUser: vi.fn(),
    getOrCreateConversation: vi.fn(),
  };

  return mockClient as bp.Client;
};

/**
 * Mock Botpress Context for unit tests
 */
export const createMockBpContext = (overrides: Partial<bp.Context> = {}): bp.Context => {
  const defaultContext: bp.Context = {
    integrationId: 'test-integration-id',
    webhookId: 'test-webhook-id',
    botId: 'test-bot-id',
    botUserId: 'test-bot-user-id',
    operation: 'test-operation',
    configurationType: 'integration' as any,
    configuration: {
      refreshToken: 'test-refresh-token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      developerApiKey: 'test-dev-api-key',
      appId: 'test-app-id',
      inboxId: 'test-inbox-id',
    },
    ...overrides,
  };

  return defaultContext;
};

/**
 * Mock Botpress Logger for unit tests
 */
export const createMockLogger = () => {
  const botLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    with: vi.fn().mockReturnThis(),
    withUserId: vi.fn().mockReturnThis(),
    withConversationId: vi.fn().mockReturnThis(),
    withVisibleToBotOwners: vi.fn().mockReturnThis(),
    withContext: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
  } as any;

  return {
    forBot: vi.fn(() => botLogger),
  } as unknown as bp.Logger;
};

/**
 * Mock user for testing
 */
export const createMockUser = (overrides: Partial<any> = {}): any => ({
  id: 'test-user-id',
  name: 'Test User',
  pictureUrl: 'https://example.com/avatar.jpg',
  tags: {
    phoneNumber: '+1234567890',
    integrationThreadId: 'test-thread-id',
    hubspotConversationId: 'test-conversation-id',
    ...overrides.tags,
  },
  ...overrides,
});

/**
 * Mock conversation for testing
 */
export const createMockConversation = (overrides: Partial<any> = {}): any => ({
  id: 'test-conversation-id',
  channel: 'hitl',
  tags: {
    id: 'test-hubspot-conversation-id',
    ...overrides.tags,
  },
  ...overrides,
});

/**
 * Mock HubSpot API response
 */
export const createMockHubSpotResponse = (data: any = {}, success: boolean = true) => ({
  success,
  message: success ? 'Request successful' : 'Request failed',
  data: success ? data : null,
});

/**
 * Mock axios response for HubSpot API
 */
export const createMockAxiosResponse = (data: any, status: number = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

/**
 * Mock state payload
 */
export const createMockStatePayload = (payload: any) => ({
  state: {
    payload,
  },
});
