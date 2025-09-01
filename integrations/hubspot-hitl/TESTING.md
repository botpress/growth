# HubSpot HITL Testing Implementation

## Overview

This document outlines the comprehensive testing strategy implemented for the HubSpot HITL integration following the plan for both unit tests and real e2e tests.

## What Was Implemented

### 1. Test Infrastructure
- **Vitest** testing framework setup with separate configurations for unit and e2e tests
- **Mock utilities** for Botpress client, context, and logger
- **Test helpers** for e2e test utilities
- **GitHub Actions** workflow for CI/CD testing

### 2. Unit Tests
- **Signature validation tests** - Comprehensive testing of HubSpot webhook signature verification
- **HITL action tests** - Testing of createUser, startHitl, stopHitl with various scenarios
- **Error handling tests** - Validation of error paths and edge cases
- **Mock-based testing** - No external API calls, pure business logic testing

### 3. E2E Test Framework  
- **Real HubSpot API integration** - Tests use actual HubSpot credentials
- **Environment validation** - Checks for required credentials before running
- **Graceful skipping** - E2E tests skip if credentials not configured
- **Real API call testing** - Tests actual HubSpot channel creation, authentication, etc.

### 4. CI/CD Integration
- **GitHub Actions workflow** with separate unit and e2e test jobs
- **Secret management** for HubSpot credentials
- **Environment-based testing** - E2E tests only run on main branch or manual trigger
- **Type checking** and linting integration

## Test Structure

```
tests/
├── unit/                              # Unit tests (business logic only)
│   ├── actions/hitl.test.ts          # HITL action tests
│   ├── client/rate-limiting.test.ts  # Rate limiting and error handling tests
│   └── utils/signature.test.ts       # Signature validation tests
├── e2e/                              # E2E tests (real HubSpot API)
│   └── full-integration-flow.test.ts # Complete workflow validation
├── utils/                            # Test utilities
│   ├── mocks.ts                      # Mock objects and helpers
│   └── test-helpers.ts               # E2E test utilities and cleanup
└── run-integration-tests.sh          # E2E test runner script
```

## Commands

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run e2e tests (requires HubSpot credentials)
./run-integration-tests.sh

# Run tests in watch mode
pnpm test:watch
```

## Test Coverage

### Unit Tests (22 tests)
- **Signature validation** (7 tests)
  - Valid signature verification
  - Invalid signature detection
  - Missing parameters handling
  - Timestamp validation
  - Multiple HTTP methods
- **HITL Actions** (9 tests)
  - User creation success/failure
  - HITL start with various states
  - Error handling and logging
  - Default value handling
- **Rate Limiting & Error Handling** (6 tests)
  - 429 rate limit error responses
  - 5xx server error handling
  - 4xx client error handling (no retry)
  - Successful request processing
  - Infrastructure verification
  - Error response structure validation

### E2E Tests (Comprehensive Integration Testing)
- **HubSpot Client Tests** - API authentication and basic operations
- **Registration Tests** - Channel creation and connection workflows
- **Component Tests** - Individual HITL action testing
- **Full Integration Flow Tests** - Complete end-to-end workflows with:
  - Sequential workflow testing (Registration → User Creation → HITL)
  - State persistence validation across operations
  - Real HubSpot API integration with rate limiting
  - Comprehensive error handling and logging
  - Automatic test cleanup with channel deletion

## Environment Setup for E2E Tests

### Required Secrets (GitHub Actions)
```
HUBSPOT_REFRESH_TOKEN
HUBSPOT_CLIENT_ID  
HUBSPOT_CLIENT_SECRET
HUBSPOT_DEVELOPER_API_KEY
HUBSPOT_APP_ID
HUBSPOT_INBOX_ID
```

### Local Development
1. Copy `test.env.example` to `test.env`
2. Fill in HubSpot credentials
3. Run `./run-integration-tests.sh`

## Key Features

### Full Integration Testing
- **Complete workflow validation** - Tests entire Registration → User Creation → HITL flow
- **State persistence testing** - Validates state management across operations
- **Real HubSpot API integration** - Uses actual HubSpot credentials and channels
- **Rate limiting handling** - Built-in exponential backoff and retry logic
- **Automatic cleanup** - Test channels are automatically deleted after completion

### Full Integration Flow Tests
- **Scope**: End-to-end workflow validation (Registration → User Creation → HITL)
- **State Management**: Custom `IntegrationStateStore` for persistent state across operations
- **Real API Integration**: Uses actual HubSpot channels with automatic cleanup
- **Error Handling**: Comprehensive error tracking and reporting
- **Rate Limiting**: Built-in retry logic with exponential backoff

## Future Enhancements

1. **Bot-level E2E tests** - Deploy a dedicated test bot for integration testing
2. **Performance testing** - Add load testing for HubSpot API limits
3. **Test data cleanup** - Automated cleanup of test conversations
4. **Coverage reporting** - Add test coverage metrics
5. **Parallel test execution** - Speed up e2e tests with parallelization

## Maintenance

- **Update credentials**: Refresh HubSpot tokens as needed
- **Monitor rate limits**: Ensure e2e tests don't exceed API limits  
- **Review test data**: Clean up any accumulated test conversations
- **Update dependencies**: Keep test frameworks current

## Success Criteria ✅

- [x] Unit tests for code paths without HubSpot API calls
- [x] E2E tests with real HubSpot credentials  
- [x] **Full integration flow testing** - Complete Registration → User Creation → HITL workflows
- [x] **State persistence validation** - Proper state management across operations
- [x] **Rate limiting handling** - Exponential backoff and retry logic for HubSpot API
- [x] **Comprehensive error tracking** - Detailed logging and error collection
- [x] **Automatic cleanup** - Test channels automatically deleted after completion
- [x] CI/CD integration with GitHub Actions
- [x] Comprehensive documentation
- [x] Environment-based test execution
- [x] Mock vs real API separation
- [x] Error handling validation
- [x] Developer-friendly setup

### Full Integration Flow Test (`full-integration-flow.test.ts`)
- **Complete workflow testing** - Tests the entire integration lifecycle in sequence
- **Persistent state management** - Custom state store that maintains state across operations
- **Real HubSpot integration** - Creates and manages actual HubSpot channels
- **Comprehensive logging** - Detailed test progress tracking with error collection
- **Automatic cleanup** - Test channels are automatically deleted after completion
- **Rate limiting compliance** - Built-in retry logic respects HubSpot API limits