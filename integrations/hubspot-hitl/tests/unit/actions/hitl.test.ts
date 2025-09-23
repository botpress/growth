import { describe, it, expect, beforeEach, vi } from 'vitest'
import { startHitl, stopHitl, createUser } from '../../../src/actions/hitl'
import {
  createMockBpClient,
  createMockBpContext,
  createMockLogger,
  createMockUser,
  CreateUserParams,
  StartHitlParams,
  StopHitlParams,
} from '../../utils/mocks'
import { RuntimeError } from '@botpress/client'

// Mock the HubSpot client
vi.mock('../../../src/client', () => ({
  getClient: vi.fn(() => ({
    createConversation: vi.fn(),
  })),
}))

describe('HITL Actions', () => {
  let mockClient: any
  let mockContext: any
  let mockLogger: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockBpClient()
    mockContext = createMockBpContext()
    mockLogger = createMockLogger()
  })

  describe('createUser', () => {
    it('should create user successfully with valid input', async () => {
      const mockUser = createMockUser()
      const input = {
        name: 'John Doe',
        email: '+1234567890', // Phone number stored in email field
        pictureUrl: 'https://example.com/avatar.jpg',
      }

      mockClient.getOrCreateUser = vi.fn().mockResolvedValue({
        user: mockUser,
      })
      mockClient.setState = vi.fn().mockResolvedValue({})

      const result = await createUser({
        client: mockClient,
        input,
        logger: mockLogger,
      } as CreateUserParams)

      expect(result).toEqual({
        userId: mockUser.id,
      })

      expect(mockClient.getOrCreateUser).toHaveBeenCalledWith({
        name: input.name,
        pictureUrl: input.pictureUrl,
        tags: {
          phoneNumber: input.email,
        },
      })

      expect(mockClient.setState).toHaveBeenCalledWith({
        id: mockUser.id,
        type: 'user',
        name: 'userInfo',
        payload: {
          name: input.name,
          phoneNumber: input.email,
        },
      })
    })

    it('should throw error when email is missing', async () => {
      const input = {
        name: 'John Doe',
        email: '', // Empty email
      }

      await expect(
        createUser({
          client: mockClient,
          input,
          logger: mockLogger,
        } as CreateUserParams)
      ).rejects.toThrow(RuntimeError)

      expect(mockLogger.forBot().error).toHaveBeenCalledWith('Email necessary for HITL')
    })

    it('should use default values for missing optional fields', async () => {
      const mockUser = createMockUser()
      const input = {
        email: '+1234567890',
        // name and pictureUrl missing
      }

      mockClient.getOrCreateUser = vi.fn().mockResolvedValue({
        user: mockUser,
      })
      mockClient.setState = vi.fn().mockResolvedValue({})

      const result = await createUser({
        client: mockClient,
        input,
        logger: mockLogger,
      } as CreateUserParams)

      expect(result).toEqual({
        userId: mockUser.id,
      })

      expect(mockClient.getOrCreateUser).toHaveBeenCalledWith({
        name: 'None',
        pictureUrl: 'None',
        tags: {
          phoneNumber: input.email,
        },
      })
    })

    it('should handle client errors gracefully', async () => {
      const input = {
        name: 'John Doe',
        email: '+1234567890',
      }

      mockClient.getOrCreateUser = vi.fn().mockRejectedValue(new Error('Client error'))

      await expect(
        createUser({
          client: mockClient,
          input,
          logger: mockLogger,
        } as CreateUserParams)
      ).rejects.toThrow(RuntimeError)
    })
  })

  describe('startHitl', () => {
    it('should return error when channelId is missing from state', async () => {
      const input = {
        userId: 'test-user-id',
        title: 'Test Title',
        description: 'Test Description',
      }

      const mockUser = createMockUser()

      mockClient.getUser = vi.fn().mockResolvedValue({ user: mockUser })
      mockClient.getState = vi
        .fn()
        .mockResolvedValueOnce({ state: { payload: {} } }) // No channelId
        .mockResolvedValueOnce({ state: { payload: { name: 'Test User', phoneNumber: '+1234567890' } } })

      const result = await startHitl({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
        input,
      } as StartHitlParams)

      expect(result).toEqual({
        success: false,
        message: 'errorMessage',
        data: null,
        conversationId: 'error_conversation_id',
      })

      expect(mockLogger.forBot().error).toHaveBeenCalledWith('No channelId found in state')
    })

    it('should return error when userInfo is missing from state', async () => {
      const input = {
        userId: 'test-user-id',
        title: 'Test Title',
        description: 'Test Description',
      }

      const mockUser = createMockUser()

      mockClient.getUser = vi.fn().mockResolvedValue({ user: mockUser })
      mockClient.getState = vi
        .fn()
        .mockResolvedValueOnce({
          state: { payload: { channelId: 'test-channel-id', channelAccountId: 'test-account-id' } },
        })
        .mockResolvedValueOnce({ state: { payload: {} } }) // No userInfo

      const result = await startHitl({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
        input,
      } as StartHitlParams)

      expect(result).toEqual({
        success: false,
        message: 'errorMessage',
        data: null,
        conversationId: 'error_conversation_id',
      })

      expect(mockLogger.forBot().error).toHaveBeenCalledWith('No userInfo found in state')
    })

    it('should handle exceptions and return error response', async () => {
      const input = {
        userId: 'test-user-id',
      }

      mockClient.getUser = vi.fn().mockRejectedValue(new Error('Database error'))

      const result = await startHitl({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
        input,
      } as StartHitlParams)

      expect(result).toEqual({
        success: false,
        message: 'Database error',
        data: null,
        conversationId: 'error_conversation_id',
      })

      expect(mockLogger.forBot().error).toHaveBeenCalledWith("'Create Conversation' exception: Database error")
    })

    it('should use default values for missing title and description', async () => {
      const input = {
        userId: 'test-user-id',
        // title and description missing
      }

      const mockUser = createMockUser()

      mockClient.getUser = vi.fn().mockResolvedValue({ user: mockUser })
      mockClient.getState = vi
        .fn()
        .mockResolvedValueOnce({
          state: { payload: { channelId: 'test-channel-id', channelAccountId: 'test-account-id' } },
        })
        .mockResolvedValueOnce({ state: { payload: { name: 'Test User', phoneNumber: '+1234567890' } } })

      // We need to mock the HubSpot client method
      const { getClient } = await import('../../../src/client')
      const mockHubSpotClient = {
        createConversation: vi.fn().mockResolvedValue({
          data: { conversationsThreadId: 'test-thread-id' },
        }),
      }
      ;(getClient as any).mockReturnValue(mockHubSpotClient)

      mockClient.getOrCreateConversation = vi.fn().mockResolvedValue({
        conversation: { id: 'test-conversation-id' },
      })
      mockClient.updateUser = vi.fn().mockResolvedValue({})

      const result = await startHitl({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
        input,
      } as StartHitlParams)

      expect(result).toEqual({
        conversationId: 'test-conversation-id',
      })

      // Verify default values were used
      expect(mockHubSpotClient.createConversation).toHaveBeenCalledWith(
        'test-channel-id',
        'test-account-id',
        expect.any(String), // integrationThreadId (UUID)
        'Test User',
        '+1234567890',
        'New HITL conversation', // default title
        'No description available' // default description
      )
    })

    it('should successfully start HITL with provided title and description', async () => {
      const input = {
        userId: 'test-user-id',
        title: 'Custom Title',
        description: 'Custom Description',
      }

      const mockUser = createMockUser()

      mockClient.getUser = vi.fn().mockResolvedValue({ user: mockUser })
      mockClient.getState = vi
        .fn()
        .mockResolvedValueOnce({
          state: { payload: { channelId: 'test-channel-id', channelAccountId: 'test-account-id' } },
        })
        .mockResolvedValueOnce({ state: { payload: { name: 'Test User', phoneNumber: '+1234567890' } } })

      // Mock the HubSpot client method
      const { getClient } = await import('../../../src/client')
      const mockHubSpotClient = {
        createConversation: vi.fn().mockResolvedValue({
          data: { conversationsThreadId: 'hubspot-thread-id' },
        }),
      }
      ;(getClient as any).mockReturnValue(mockHubSpotClient)

      mockClient.getOrCreateConversation = vi.fn().mockResolvedValue({
        conversation: { id: 'test-conversation-id' },
      })
      mockClient.updateUser = vi.fn().mockResolvedValue({})

      const result = await startHitl({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
        input,
      } as StartHitlParams)

      expect(result).toEqual({
        conversationId: 'test-conversation-id',
      })

      // Verify HubSpot conversation was created with provided values
      expect(mockHubSpotClient.createConversation).toHaveBeenCalledWith(
        'test-channel-id',
        'test-account-id',
        expect.any(String), // integrationThreadId (UUID)
        'Test User',
        '+1234567890',
        'Custom Title',
        'Custom Description'
      )

      // Verify Botpress conversation was created
      expect(mockClient.getOrCreateConversation).toHaveBeenCalledWith({
        channel: 'hitl',
        tags: {
          id: 'hubspot-thread-id',
        },
      })

      // Verify user was updated with conversation mapping
      expect(mockClient.updateUser).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        pictureUrl: mockUser.pictureUrl,
        tags: {
          integrationThreadId: expect.any(String), // UUID generated in the function
          hubspotConversationId: 'hubspot-thread-id',
        },
      })
    })
  })

  describe('stopHitl', () => {
    it('should return empty object', async () => {
      const result = await stopHitl({} as StopHitlParams)
      expect(result).toEqual({})
    })
  })
})
