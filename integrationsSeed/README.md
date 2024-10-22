# Integrations Seeding Script

This script allows you to seed integration data into your system with titles and logos. It uses OpenAI to assist in generating descriptions or other relevant metadata for each integration. If integration already exists, it will not be overwritten

## Prerequisites

Before starting, ensure that:

1. You are logged into the correct workspace. Your workspace should have both the handler and about information set up.

## Setup

Follow these steps to set up and use the project:

1. Clone this repository.
2. Add your OpenAI API key to the `.env` file:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```
3. Populate the integrationsList.csv file with the integration titles and links to their PNG logos.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the seeding script
   ```bash
   npm run seed
   ```
