import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { register } from '../../src/setup/register'
import { startHitl, createUser } from '../../src/actions/hitl'
import { createMockBpContext, createMockLogger } from '../utils/mocks'
import { TestHelpers } from '../utils/test-helpers'

// Persistent state store that mimics Botpress state behavior
class IntegrationStateStore {
  private integrationStates = new Map<string, Map<string, any>>()
  private userStates = new Map<string, Map<string, any>>()

  getState({ id, name, type }: { id: string; name: string; type: string }) {
    const stateMap = type === 'integration' ? this.integrationStates : this.userStates
    const entityStates = stateMap.get(id) || new Map()
    const payload = entityStates.get(name) || {}

    return Promise.resolve({
      state: { payload },
    })
  }

  setState({ id, name, type, payload }: { id: string; name: string; type: string; payload: any }) {
    const stateMap = type === 'integration' ? this.integrationStates : this.userStates

    if (!stateMap.has(id)) {
      stateMap.set(id, new Map())
    }

    stateMap.get(id)!.set(name, payload)
    return Promise.resolve({})
  }

  clear() {
    this.integrationStates.clear()
    this.userStates.clear()
  }

  // Debug helper
  debugState() {
    console.log('Integration States:', Object.fromEntries(this.integrationStates))
    console.log('User States:', Object.fromEntries(this.userStates))
  }
}

describe.skipIf(!process.env.HUBSPOT_REFRESH_TOKEN)('Full Integration Flow E2E Tests', () => {
  let mockContext: any
  let mockLogger: any
  let stateStore: IntegrationStateStore
  let mockClient: any
  let testId: string
  let createdChannelId: string | null = null
  let testUserId: string

  // Test error tracking
  const testErrors: Array<{ testName: string; error: any; timestamp: string }> = []

  beforeAll(async () => {
    console.log('=== Full Integration Flow Test Starting ===')

    if (!process.env.HUBSPOT_REFRESH_TOKEN) {
      console.log('Skipping integration tests - HUBSPOT_REFRESH_TOKEN not configured')
      return
    }

    testId = TestHelpers.generateTestId()
    testUserId = `integration-test-user-${testId}`

    console.log(`Test ID: ${testId}`)
    console.log(`Test User ID: ${testUserId}`)

    // Initialize shared components for all tests
    stateStore = new IntegrationStateStore()
    mockLogger = createMockLogger()

    mockContext = createMockBpContext({
      integrationId: `test-integration-${testId}`,
      configuration: {
        refreshToken: process.env.HUBSPOT_REFRESH_TOKEN!,
        clientId: process.env.HUBSPOT_CLIENT_ID!,
        clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
        developerApiKey: process.env.HUBSPOT_DEVELOPER_API_KEY!,
        appId: process.env.HUBSPOT_APP_ID!,
        inboxId: process.env.HUBSPOT_INBOX_ID!,
      },
    })

    // Create shared mock client
    mockClient = {
      getState: vi.fn().mockImplementation((params) => stateStore.getState(params)),
      setState: vi.fn().mockImplementation((params) => stateStore.setState(params)),

      getUser: vi.fn().mockImplementation(({ id }) => {
        return Promise.resolve({
          user: {
            id,
            name: `Test User ${testId}`,
            tags: {
              phoneNumber: '+15196583579',
              integrationThreadId: `thread-${testId}`,
              hubspotConversationId: `conv-${testId}`,
            },
          },
        })
      }),

      getOrCreateUser: vi.fn().mockImplementation(({ name, pictureUrl, tags }) => {
        return Promise.resolve({
          user: {
            id: testUserId,
            name,
            pictureUrl,
            tags,
          },
        })
      }),

      updateUser: vi.fn().mockResolvedValue({}),

      getOrCreateConversation: vi.fn().mockImplementation(({ channel, tags }) => {
        return Promise.resolve({
          conversation: {
            id: `test-conversation-${testId}`,
            channel,
            tags,
          },
        })
      }),
    }

    console.log('Shared test environment initialized')

    // SINGLE REGISTRATION FOR ALL TESTS
    try {
      console.log('Running single registration for all tests...')
      await register({
        ctx: mockContext,
        client: mockClient,
        logger: mockLogger,
      })

      // Get and store the channel ID for all tests
      const channelState = await stateStore.getState({
        id: mockContext.integrationId,
        name: 'channelInfo',
        type: 'integration',
      })

      createdChannelId = channelState.state.payload.channelId
      console.log(`Shared channel created for all tests. Channel ID: ${createdChannelId}`)
    } catch (error) {
      console.error('Failed to register shared channel:', error)
      throw error
    }
  })

  afterAll(async () => {
    console.log('=== Full Integration Flow Test Cleanup Starting ===')

    if (createdChannelId && process.env.HUBSPOT_REFRESH_TOKEN) {
      console.log(`Cleaning up created channel: ${createdChannelId}`)
      try {
        const success = await TestHelpers.deleteCustomChannel(createdChannelId)
        if (success) {
          console.log('Successfully cleaned up test channel')
        } else {
          console.warn('Failed to cleanup test channel - may need manual cleanup')
        }
      } catch (error) {
        console.error('Error during cleanup:', error)
        testErrors.push({
          testName: 'cleanup',
          error,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Report any test errors
    if (testErrors.length > 0) {
      console.error('=== Test Errors Summary ===')
      testErrors.forEach((errorInfo, index) => {
        console.error(`Error ${index + 1}:`)
        console.error(`  Test: ${errorInfo.testName}`)
        console.error(`  Time: ${errorInfo.timestamp}`)
        console.error(`  Error:`, errorInfo.error)
        console.error('---')
      })
    } else {
      console.log('All tests completed without errors')
    }

    console.log('=== Full Integration Flow Test Cleanup Complete ===')
  })

  beforeEach(() => {
    console.log(`--- Preparing individual test ---`)

    // Reset mock call counts for each test (but keep the same instances)
    vi.clearAllMocks()

    // Re-setup the mock implementations (they get cleared by vi.clearAllMocks)
    mockClient.getState = vi.fn().mockImplementation((params) => stateStore.getState(params))
    mockClient.setState = vi.fn().mockImplementation((params) => stateStore.setState(params))
    mockClient.getUser = vi.fn().mockImplementation(({ id }) => {
      return Promise.resolve({
        user: {
          id,
          name: `Test User ${testId}`,
          tags: {
            phoneNumber: '+15196583579',
            integrationThreadId: `thread-${testId}`,
            hubspotConversationId: `conv-${testId}`,
          },
        },
      })
    })
    mockClient.getOrCreateUser = vi.fn().mockImplementation(({ name, pictureUrl, tags }) => {
      return Promise.resolve({
        user: {
          id: testUserId,
          name,
          pictureUrl,
          tags,
        },
      })
    })
    mockClient.updateUser = vi.fn().mockResolvedValue({})
    mockClient.getOrCreateConversation = vi.fn().mockImplementation(({ channel, tags }) => {
      return Promise.resolve({
        conversation: {
          id: `test-conversation-${testId}`,
          channel,
          tags,
        },
      })
    })

    console.log('Mock implementations reset for individual test')
  })

  describe('Complete Integration Workflow', () => {
    it('should execute user creation → HITL flow using shared channel', async () => {
      const testName = 'user-creation-hitl-flow'
      console.log(`[${testName}] Starting user creation and HITL flow...`)

      try {
        // Verify shared channel exists
        console.log(`[${testName}] Verifying shared channel state...`)
        const channelState = await stateStore.getState({
          id: mockContext.integrationId,
          name: 'channelInfo',
          type: 'integration',
        })

        console.log(`[${testName}] Channel state retrieved:`, channelState.state.payload)

        expect(channelState.state.payload).toHaveProperty('channelId')
        expect(channelState.state.payload).toHaveProperty('channelAccountId')
        expect(channelState.state.payload.channelId).toBeTruthy()
        expect(channelState.state.payload.channelId).toBe(createdChannelId)

        console.log(`[${testName}] Using shared channel ID: ${createdChannelId}`)

        // STEP 1: User Creation (stores user state)
        console.log(`[${testName}] Step 1: Creating user...`)
        console.log(`[${testName}] Creating user with ID: ${testUserId}`)

        const userResult = await createUser({
          client: mockClient,
          input: {
            name: `Integration Test User ${testId}`,
            email: '+15196583579', // Phone stored in email field
            pictureUrl: 'https://example.com/test-avatar.jpg',
          },
          logger: mockLogger,
        } as any)

        console.log(`[${testName}] User creation result:`, userResult)
        expect(userResult).toHaveProperty('userId')
        expect(userResult.userId).toBe(testUserId)

        // Verify user state was created
        console.log(`[${testName}] Verifying user state...`)
        const userState = await stateStore.getState({
          id: testUserId,
          name: 'userInfo',
          type: 'user',
        })

        console.log(`[${testName}] User state retrieved:`, userState.state.payload)
        expect(userState.state.payload).toHaveProperty('name')
        expect(userState.state.payload).toHaveProperty('phoneNumber')
        expect(userState.state.payload.phoneNumber).toBe('+15196583579')

        console.log(`[${testName}] User creation completed`)

        // STEP 2: Start HITL (uses both channel and user states)
        console.log(`[${testName}] Step 2: Starting HITL session...`)
        console.log(`[${testName}] Using channel ID: ${createdChannelId} and user ID: ${testUserId}`)

        const hitlResult = await startHitl({
          ctx: mockContext,
          client: mockClient,
          logger: mockLogger,
          input: {
            userId: testUserId,
            title: `Integration Test Conversation ${testId}`,
            description: 'Full integration test conversation',
          },
        } as any)

        console.log(`[${testName}] HITL result:`, hitlResult)

        // Should succeed because all required states exist
        expect(hitlResult).toHaveProperty('conversationId')
        expect(hitlResult.conversationId).toBeTruthy()
        expect(hitlResult.conversationId).not.toBe('error_conversation_id')

        console.log(`[${testName}] HITL session started. Conversation ID: ${hitlResult.conversationId}`)

        // Verify expected user interactions occurred (channel was set in beforeAll)
        console.log(`[${testName}] Verifying client interactions...`)

        expect(mockClient.setState).toHaveBeenCalledWith(
          expect.objectContaining({
            id: testUserId,
            type: 'user',
            name: 'userInfo',
          })
        )

        expect(mockClient.getState).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockContext.integrationId,
            name: 'channelInfo',
            type: 'integration',
          })
        )

        expect(mockClient.getState).toHaveBeenCalledWith(
          expect.objectContaining({
            id: testUserId,
            name: 'userInfo',
            type: 'user',
          })
        )

        console.log(`[${testName}] All client interactions verified successfully`)
        console.log(`[${testName}] Complete integration workflow test passed!`)
      } catch (error) {
        console.error(`[${testName}] Test failed with error:`, error)
        testErrors.push({
          testName,
          error,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }, 180000) // 3 minutes timeout for full flow including HubSpot API calls

    it('should handle workflow interruption gracefully', async () => {
      const testName = 'workflow-interruption'
      console.log(`[${testName}] Testing workflow interruption handling...`)

      try {
        // Use shared channel (no need to register again)
        console.log(`[${testName}] Using shared channel: ${createdChannelId}`)

        // Try to start HITL without creating user first (missing userInfo state)
        console.log(`[${testName}] Attempting HITL without user state (should fail)...`)
        const hitlResult = await startHitl({
          ctx: mockContext,
          client: mockClient,
          logger: mockLogger,
          input: {
            userId: 'non-existent-user',
            title: 'Test Conversation',
            description: 'Should fail due to missing user state',
          },
        } as any)

        console.log(`[${testName}] HITL result (should be error):`, hitlResult)

        // Should fail gracefully
        expect(hitlResult).toEqual({
          success: false,
          message: 'errorMessage',
          data: null,
          conversationId: 'error_conversation_id',
        })

        console.log(`[${testName}] Workflow interruption handled correctly`)
      } catch (error) {
        console.error(`[${testName}] Test failed with error:`, error)
        testErrors.push({
          testName,
          error,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }, 120000)
  })

  describe('State Persistence Validation', () => {
    it('should maintain state consistency across operations', async () => {
      const testName = 'state-persistence'
      console.log(`[${testName}] Testing state persistence...`)

      try {
        // Use shared channel state
        console.log(`[${testName}] Verifying shared channel state persistence...`)
        const channelState1 = await stateStore.getState({
          id: mockContext.integrationId,
          name: 'channelInfo',
          type: 'integration',
        })

        console.log(`[${testName}] Shared channel state - Channel ID: ${channelState1.state.payload.channelId}`)
        expect(channelState1.state.payload.channelId).toBe(createdChannelId)

        // Create user and verify both states exist
        console.log(`[${testName}] Creating user for state persistence test...`)
        await createUser({
          client: mockClient,
          input: {
            name: 'State Test User',
            email: '+15196583579',
          },
          logger: mockLogger,
        } as any)

        console.log(`[${testName}] User created, verifying state persistence...`)

        // Verify both states are still accessible
        const channelState2 = await stateStore.getState({
          id: mockContext.integrationId,
          name: 'channelInfo',
          type: 'integration',
        })

        const userState = await stateStore.getState({
          id: testUserId,
          name: 'userInfo',
          type: 'user',
        })

        console.log(`[${testName}] Channel state after user creation:`, channelState2.state.payload)
        console.log(`[${testName}] User state:`, userState.state.payload)

        expect(channelState2.state.payload.channelId).toBe(channelState1.state.payload.channelId)
        expect(userState.state.payload.phoneNumber).toBe('+15196583579')

        console.log(`[${testName}] State persistence validated successfully`)
      } catch (error) {
        console.error(`[${testName}] Test failed with error:`, error)
        testErrors.push({
          testName,
          error,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }, 120000)
  })
})
