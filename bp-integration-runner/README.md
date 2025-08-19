# Botpress Integration Runner

## 🧰 Purpose

This utility package simplifies the local development of Botpress integrations.

Once set up, a single command will:

- Start a local build that hot-reloads on changes to the integration.
- Expose it to a public URL using ngrok.
- Update the locally hosted URL of your integration in Botpress via the Botpress API.

## ⚙️ Setup

- Install the package

  ```bash
  npm i --save-dev @growth-botpress/bp-integration-runner
  ```

- add a `.env` to the root of your botpress integration project with the following keys.

  ```md
  BOTPRESS_PAT: |YOUR PERSONAL ACCESS TOKEN|
  BOTPRESS_WORKSPACE_ID: |YOUR WORKSPACE ID|
  ```

- add the following to the scripts of the `package.json` of your botpress integration project.

  ```json
  {
    "scripts": {
      "dev-local": "bp-integration-runner"
    }
  }
  ```

- you're all setup! to start run `npm run dev-local` from the root of your botpress integration project. Happy bot building!
