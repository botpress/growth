#!/usr/bin/env node

import ngrok from "ngrok";
import axios from "axios";
import portfinder from "portfinder";
import { exec, execSync, spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import boxen from "boxen";
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const isWindows = os.platform() === 'win32';
const __localbp = path.join(process.cwd(), "node_modules", ".bin", isWindows ? "bp.cmd" : "bp");

// Verify that the user has a valid ngrok authentication code
try { 
  const cmd = `ngrok config check`;
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  console.log(boxen(
    `
    Could not verify ngrok authentication
    Please authenticate ngrok by following these steps:

    1. Create an account on https://ngrok.com
    2. Get your auth token from https://dashboard.ngrok.com/get-started/setup
    3. Run: npx ngrok config add-authtoken YOUR_TOKEN
    `,
    {
      title: "⚠️ Missing ngrok Authentication ⚠️",
      titleAlignment: "center",
      borderColor: "red",
      padding: 1,
    }
  ));
  process.exit(1);
}
// Verify that bp executable exists
if (!fs.existsSync(__localbp)) {
  console.log(boxen(
    `
    Could not find Botpress CLI at ${__localbp}
    Please ensure @botpress/cli is installed in your project
    `,
    {
      title: "⚠️ Missing Botpress CLI ⚠️",
      titleAlignment: "center",
      borderColor: "red",
      padding: 1,
    }
  ));
  process.exit(1);
}
// Load the parent project's .env file
try {
  dotenv.config({ path: path.join(process.cwd(), ".env") });
} catch (e) {
  console.error("⚠️ No .env file found in the parent directory ⚠️");
  process.exit(1);
}

// Check for required environment variables
if (!process.env.BOTPRESS_PAT) {
  console.log(boxen(
    `
      "BOTPRESS_PAT" is missing in the .env file
      Find your Botpress PAT from https://app.botpress.cloud/profile/settings
      `,
    {
      title: "⚠️ Missing required environment variables ⚠️",
      titleAlignment: "center",
      borderColor: "red",
      padding: 1,
    }
  ));
  process.exit(1);
}

if (!process.env.BOTPRESS_WORKSPACE_ID) {
  console.log(boxen(
    `
      "BOTPRESS_WORKSPACE_ID" is missing in the .env file
      Find your Botpress Workspace ID from the URL of your workspace
      `,
    {
      title: "⚠️ Missing required environment variables ⚠️",
      titleAlignment: "center",
      borderColor: "red",
      padding: 1,
    }
  ));
  process.exit(1);
}

const axiosClient = axios.create({
  baseURL: "https://api.botpress.cloud/v1/admin/",
  headers: {
    Authorization: `Bearer ${process.env.BOTPRESS_PAT}`,
    "x-workspace-id": process.env.BOTPRESS_WORKSPACE_ID,
  },
});

const getIntegrationId = async (integrationName) => {
  const response = await axiosClient.get("/integrations");
  const integrations = response.data.integrations;

  const integration = integrations.find((integration) => {
    return integration.name === integrationName;
  });

  if (!integration) {
    throw new Error("⚠️ Integration not found ⚠️");
  }

  return integration.id;
};

const updateIntegrationUrl = async (id, url) => {
  await axiosClient.put(`/integrations/${id}`, { url });
};

const start = async () => {
  const rootPackageJson = path.resolve(process.cwd(), "./package.json");
  const data = fs.readFileSync(rootPackageJson, "utf8");

  const integrationName = JSON.parse(data).integrationName;
  let id = await getIntegrationId(integrationName).catch(async () => {
    console.log(`🟡 Integration was not found in botpress cloud. 🟡 `);
    console.log(`🟠 Deploying integration... 🟠`);
  
    const deployCommand = `${__localbp} deploy --workspaceId ${process.env.BOTPRESS_WORKSPACE_ID} --token ${process.env.BOTPRESS_PAT} -y`;

    execSync(deployCommand, { stdio: 'inherit' });

    return await getIntegrationId(integrationName);
  })

  const PORT = await portfinder.getPortPromise();

  // Pipe port to public URL using ngrok
  const url = await ngrok.connect(PORT);

  // Run Botpress dev locally
  const devCommand = `${__localbp} dev --port ${PORT} --workspaceId ${process.env.BOTPRESS_WORKSPACE_ID} --token ${process.env.BOTPRESS_PAT}`;
  const [command, ...args] = devCommand.split(' ');
  spawn(command, args, { stdio: 'inherit' });

  // Update the integration URL
  await updateIntegrationUrl(id, url);

  setTimeout(async () => {
    const targetURL = `https://app.botpress.cloud/workspaces/${process.env.BOTPRESS_WORKSPACE_ID}/integrations/${id}`;

    const title = "Your integration is now built and running!";
    const content = `
 > Head over to the following URL to install and start using your integration:
    👉 [ ${targetURL} ]

 > Changes will trigger hot reloading automatically.
      `;
    console.log(
      boxen(content, {
        title,
        titleAlignment: "center",
        borderColor: "cyan",
        padding: 1,
      })
    );
  }, 3500);
};

start();
