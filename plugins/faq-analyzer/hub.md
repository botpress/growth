# FAQ Analyzer Plugin

This plugin analyzes user conversations to identify and track frequently asked questions (FAQs).

It processes incoming messages, extracts questions, and stores them in a database table along with a count of how many times they have been asked.

This data can be used to understand what users are asking most often, which can help improve bot content and identify areas where the bot may need human intervention.

## Configuration

- **Table Name**: Configure the name of the table used to store the FAQ data.

## How it works

The plugin uses Botpress's AI capabilities to:

- Normalize questions, converting variations into a standard format.
- Identify follow-up questions and rewrite them as standalone questions based on conversation context.
- Check for semantic similarity between new questions and existing ones to avoid duplicates.

When a new question or a similar variation of an existing question is detected, the plugin updates the count for that question in the configured table.
