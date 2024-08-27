# Hugging Face Integration

This integration allows your bot to use pre-warmed chat completion models hosted on Hugging Face as the LLM for any node, workflow, or skill. Explore available models [here](https://huggingface.co/models?inference=warm&pipeline_tag=text-generation).

> **Note:** Usage is billed directly by Hugging Face.

## 1. Obtain Hugging face access token

- Go to Settings: Click your profile icon in the top right and select Settings.
- Generate Token: Under Access Tokens, click "New token", name it, set the role, and click "Generate".
- Add it to the integration configuration

## 2. List the models you want to use

Specify which Hugging Face models should be available for your bot by listing their model IDs, separated by commas.

You can find the model ID on each model's page on Hugging Face. For example, the model ID for GPT-2 is `gpt2`. Make sure to separate multiple model IDs with commas in your configuration.

<div>
<img src="https://i.imgur.com/2gx0wnB.png" alt="Example of entering model IDs" style="max-width: 500px;">
</div>
