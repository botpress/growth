import "dotenv/config";
import { exec } from "child_process";
import { promisify } from "util";
import { OpenAI } from "openai";
import { PromptManager } from "PromptManager";

const execAsync = promisify(exec);

async function generateAiContent(prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o",
  });

  const description = chatCompletion.choices[0]?.message.content;

  return description ?? "";
}

export async function handleSetup(
  integrationPath: string,
  title: string,
  dashedTitle: string
): Promise<void> {
  console.log(`Setting up ${title} integration`);
  const promptManager = new PromptManager(title);

  const descriptionPrompt = promptManager.getPrompt("description");
  const description = await generateAiContent(descriptionPrompt);

  console.log(`Successfully generated description for ${title} integration`);

  await execAsync(`
    sed -i '' $'6i\\
    title: \\"${title}\\",\\
    description: \\"${description}\\",\\
    ' ${integrationPath}/integration.definition.ts
  `);

  console.log(`Successfully inserted description for ${title} integration`);

  const readmePrompt = promptManager.getPrompt("readme");
  const readme = await generateAiContent(readmePrompt);

  console.log(`Successfully generated README for ${title} integration`);

  await execAsync(`echo "${readme}" > ${integrationPath}/hub.md`);

  console.log(`Successfully inserted README for ${title} integration`);

  await execAsync(
    `
      sed -i '' \
      -e 's/"name": "placeholder_integration"/"name": "${dashedTitle}"/g' \
      -e 's/"integrationName": "placeholder-integration"/"integrationName": "${dashedTitle}"/g' \
      ${integrationPath}/package.json
      `
  );
  console.log(`Successfully inserted definitions into ${title} integration`);
}
