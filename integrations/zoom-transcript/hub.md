# Zoom Transcript Integration

Easily receive and automate Zoom meeting transcripts in Botpress for meetings hosted by a specific Zoom user.

## How It Works

1. **Zoom meeting ends:** Zoom sends a webhook when transcript is ready.
2. **Integration checks `host_id`:** Only processes events for the specified user.
3. **Transcript fetched:** The transcript is downloaded and converted to plain text.
4. **Event emitted:** A `transcriptReceived` event with `meetingUUID` and `transcript` is available for your Botpress flows.

## Usage

- **Trigger workflows:** Add a "Listen to Event" card for `transcriptReceived`.
- **Access data:** Use `event.payload.meetingUUID` and `event.payload.transcript` in flows.
- **Store in tables:** Save meeting transcripts for later analysis or reporting.

## Setup

1. Create a Zoom Server-to-Server OAuth app; get Client ID, Secret, Account ID, and Secret Token.
2. Add this integration to your Botpress bot and fill in the credentials and your target Zoom User ID's (`host_id`).
3. Set your Zoom webhook endpoint to the Botpress integration URL.
4. Build your workflow using the `transcriptReceived` trigger.
