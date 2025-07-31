# HITL Starter Integration

This project provides a Human-In-The-Loop (HITL) integration for Botpress. It allows you to create a seamless handoff between automated bot interactions and human agents. This integration includes features like starting and stopping HITL sessions, creating remote users and conversations, sending messages, and more.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## Prerequisites

- Node.js and npm installed.
- A Botpress workspace and a bot ready to have the integration installed to.

## Installation

1. Clone this repository:
   \`\`\`bash
   git clone https://github.com/ptrckbp/hitl-starter.git
   \`\`\`

2. Navigate to the project directory:
   \`\`\`bash
   cd hitl-starter
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

## Usage

### Logging into Botpress

Before deploying, make sure to log in to your Botpress account, run:
\`\`\`bash
npm run login
\`\`\`

### Running the Integration

To start the integration and automatically deploy changes, run:
\`\`\`bash
npm run start
\`\`\`

This command uses \`nodemon\` to watch for changes in the TypeScript files and automatically deploys the integration.

### Deploying the Integration

To manually deploy the integration to Botpress, run:
\`\`\`bash
npm run deploy
\`\`\`

## API Endpoints

The integration requires you to implement several API endpoints to interact with the HITL process:

- **\`/ping\`** - Pings your external service to check if it is ready.
- **\`/createRemoteConversation\`** - Creates a new remote conversation.
- **\`/closeRemoteTicket\`** - Closes a remote ticket.
- **\`/createRemoteUser\`** - Creates a new remote user.
- **\`/botSendsMessage\`** - Sends a message from the bot to an agent conversation.

Refer to the \`src/externalService.ts\` file for the implementation details of these endpoints.

It also exposes the following endpoints for you to interact with Botpress conversations.

- **\`/message-from-agent\`** - Sends a message from the agent to the user through Botpress.
- **\`/agent-assigned\`** - Assigns an agent to a conversation
- **\`/stop-hitl\`** - Closes a ticket, ending HITL in the conversation.

## Scripts

- **\`npm run login\`**: Log in to your Botpress account.
- **\`npm run start\`**: Start the integration in watch mode and automatically deploy changes.
- **\`npm run deploy\`**: Deploy the integration to Botpress.
- **\`npm run generate-docs\`**: Generate OpenAPI documentation.

## Project Structure

- **\`src/index.ts\`**: The main entry point of the integration. Registers actions, channels, and the handler.
- **\`src/types.ts\`**: Defines the data types and schemas using Zod.
- **\`src/handler.ts\`**: Handles incoming requests and dispatches them to the relevant functions.
- **\`src/externalService.ts\`**: Implements the external service interaction logic.

## Technologies Used

- **Botpress**: An open-source conversational AI platform.
- **TypeScript**: A typed superset of JavaScript.
- **Axios**: A promise-based HTTP client for making API requests.
- **Zod**: A TypeScript-first schema declaration and validation library.
- **Swagger**: For API documentation.
