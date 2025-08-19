# LiveChat HITL Chat Transfer Feature

## Overview

This integration now includes automatic chat transfer functionality that triggers right after a chat is created and a customer is added. The chat will be automatically transferred to a specified target group using the LiveChat Agent API.

## How It Works

1. **Chat Creation**: When `startHitl` action is called, a new chat is created in the configured group
2. **Customer Addition**: The customer is added to the chat using their access token
3. **Automatic Transfer**: The chat is automatically transferred to the same group to ensure proper placement and routing
4. **Logging**: All transfer operations are logged with success/failure information

## API Endpoint Used

The implementation uses the LiveChat Agent API endpoint:

```
POST https://api.livechatinc.com/v3.5/agent/action/transfer_chat
```

With the payload:

```json
{
  "id": "CHAT_ID",
  "target": {
    "type": "group",
    "ids": [19]
  }
}
```

## Error Handling

- If the transfer fails, the operation continues (chat creation and customer addition are not affected)
- All errors are logged for debugging purposes
- The integration gracefully handles transfer failures

## Requirements

- LiveChat Agent Token (Base64 encoded)
- Valid group ID (used for both chat creation and transfer)
- Proper permissions for the agent token to transfer chats

## Notes

- The transfer happens automatically after customer addition
- No manual intervention required
- Transfer failures don't affect the main HITL functionality
- All operations are logged for monitoring and debugging
