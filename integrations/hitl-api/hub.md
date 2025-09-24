# HITL Starter Integration

This project provides a Human-In-The-Loop (HITL) AKA human agent handoff integration for Botpress. It allows you to create a seamless handoff between automated bot interactions and human agents. This integration includes features like starting and stopping HITL sessions, creating remote users and conversations, sending messages, and more.

To use it, you must run your own service that implements 5 endpoints, and exposes 3 endpoints for interacting with chat.

While we generally recommend writing an integration on Botpress infrastructure to connect with your service. This allows you to write a service in any programming language and use any tools you'd like.

This is also a good starting point to try an integration locally to understand it. You can find the source code here: https://github.com/botpress/growth/tree/master/integrations/hitl-api

We recommend you use requestbin for a quick look, and an ngrok-enabled server for development.

## How to use

You can find the full instructions on how to use this integration [👉 here 👈](https://botpress.com/reference/botpress-hitl-integration-apis)
