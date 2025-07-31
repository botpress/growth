# Zoom Transcript Integration

Easily receive and automate Zoom meeting transcripts in Botpress for meetings hosted by specific Zoom users.

## How It Works

1. **Zoom meeting ends** → Zoom sends a webhook when transcript is ready.
2. **Integration filters `host_id`** → Only allows events from specified Zoom user(s).
3. **Transcript is fetched and cleaned** → Downloaded from Zoom and converted to plain text.
4. **Event emitted** → A `transcriptReceived` event with `meetingUUID` and `transcript` is available to your flows.

---

## Usage

- **Trigger workflows** → Add a "Listen to Event" card for `transcriptReceived`.
- **Access data** → Use `event.payload.meetingUUID` and `event.payload.transcript` in flows.
- **Store transcripts** → Save to tables for later analysis or reporting.

---

## Prerequisites

You must be:

- A Zoom **account owner**, **admin**, or have the **“Zoom for Developers” role**
- On a **Zoom premium plan** (free tier doesn't support cloud recordings)

---

## Step-by-Step Setup

### 1. Create a Zoom OAuth App

- Visit: [https://marketplace.zoom.us/](https://marketplace.zoom.us/)
- Go to **Develop > Build App** → Choose **Server-to-Server OAuth** → Name your app
- On the **App Credentials** page, copy:
  - **Account ID**
  - **Client ID**
  - **Client Secret**

You’ll use these in your Botpress integration configuration later.

- In **Information**, fill out the necessary information about yourself and the app.
- In **Features**, copy the **Secret Token**
- In **Scopes**, add:
  cloud_recording:read:list_user_recordings:admin
  cloud_recording:read:list_recording_files:admin
  cloud_recording:read:recording:admin

- Activate the app under the **Activation** tab

### 2. Get Zoom `host_id`

In Postman:

**Step 1: Get Access Token**

- To make request, you can use service like postman
- Make a **POST** request to `https://zoom.us/oauth/token`
- **Headers** (Key: Value):
- `Authorization`: `Basic <BASE64(CLIENT_ID:CLIENT_SECRET)>`
- for <BASE64(CLIENT_ID:CLIENT_SECRET)> you can use paste it on this site https://www.base64encode.org/ your CLIENT_ID:CLIENT_SECRET you got earlier from the zoom app, and then select encode
- `Content-Type`: `application/x-www-form-urlencoded`
- **Body (x-www-form-urlencoded)** (Key: Value):
- `grant_type`: `account_credentials`
- `account_id`: `<your Zoom Account ID>`
- Click Send then Copy the `access_token` from the response

**Step 2: Get Host ID**

- Make a **GET** request to: `https://api.zoom.us/v2/users/<your_zoom_email>/recordings`
- **Header**:
- `Authorization`: `Bearer <access_token>`
- Click Send then Copy the `host_id` in the response

---

### 3. Configure the Botpress Integration

- Install this integration into your Bot
- Paste:
- `Zoom Client ID`
- `Zoom Client Secret`
- `Zoom Account ID`
- `Secret Token`
- `Allowed Zoom User IDs` → Paste your `host_id` (you can include multiple)

Click **Save Configuration**.

---

### 4. Set Webhook in Zoom

Back in your Zoom OAuth App:

- Go to **Features** → Enable **Event Subscriptions**
- Name: `recording.transcript_completed`
- Method: `Webhook`
- Endpoint URL: use the **Botpress integration URL**
- Add Events:
- Under **Recording**:
  - `All recordings have completed`
  - `Recording transcript files have completed`
- Click **Done**
- Click **Validate** next to the endpoint URL (you should see Validated)
- Click **Save**

---

## Done!

Your Botpress bot will now receive transcripts for allowed Zoom users when cloud recordings complete. Make sure:

- You **record to the cloud**
- You’re on a **paid Zoom plan**
- You’ve correctly added all intended `host_id`s
