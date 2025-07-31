// Helper methods for Zoom API and transcript processing
import { RuntimeError } from "@botpress/sdk";

type ZoomConfig = { clientId: string; clientSecret: string; accountId: string };

// Step 1: Get OAuth Access Token
export async function getAccessToken(config: ZoomConfig): Promise<string> {
  const { clientId, clientSecret, accountId } = config;
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const json = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    const errorMsg = `Zoom access token fetch failed (HTTP ${res.status}): ${json.error_description || json.error || "Unknown error"}`;
    console.error(errorMsg, json);
    throw new RuntimeError(errorMsg);
  }
  return json.access_token;
}

// Step 2: Find transcript file URL with up to 3 retries
export async function findTranscriptFile(
  meetingUUID: string,
  accessToken: string,
): Promise<string | null> {
  const encodedUUID = encodeURIComponent(meetingUUID);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const recRes = await fetch(
      `https://api.zoom.us/v2/meetings/${encodedUUID}/recordings`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const recData = (await recRes.json()) as { recording_files?: any[] };
    const files = recData.recording_files || [];
    const transcriptFile = files.find(
      (f) => f.file_type === "TRANSCRIPT" && f.file_extension === "VTT",
    );
    if (transcriptFile?.download_url) return transcriptFile.download_url;
    await new Promise((res) => setTimeout(res, 20000)); // wait 20s
  }
  return null;
}

// Step 3: Download VTT file
export async function fetchVttFile(
  url: string,
  accessToken: string,
): Promise<string> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return await res.text();
}

// Step 4: Clean VTT to plain text
export function cleanVtt(vtt: string): string {
  return vtt
    .replace(/WEBVTT\n/g, "")
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> .*\n/g, "")
    .replace(/\n+/g, " ")
    .trim();
}
