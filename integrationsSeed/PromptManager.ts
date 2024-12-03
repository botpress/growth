type PromptType = "description" | "readme";

export class PromptManager {
  private templates: Record<PromptType, (title: string) => string> = {
    description: (title) => `
Provide a brief, keyword-optimized and SEO friendly description of the ${title} integration with Botpress. It needs to be 30 words or less. It must not use single quotes (') or double quotes ("). Very importatnt: no single or double quotes used.
Here's an example of a good description: Learn how to integrate Slack with AI and unlock advanced automation, productivity, and communication capabilities with generative AI.`,
    readme: (title) => `
Generate an SEO-optimized README for the ${title} integration with Botpress. It must not use single quotes (') or double quotes ("). Very importatnt: no single or double quotes used. The first line always needs to be: "# Integrate ${title} with AI". Here is an example of a good README:
# Integrate Slack with AI
Unlock the full potential of Slack by integrating it with generative AI technologies. With AI, you can automate routine tasks, generate intelligent responses, analyze conversations in real time, and enhance team collaboration. From improving customer support with AI-powered bots to using natural language processing for more intuitive interactions, the possibilities are endless.
## What is Slack?
Slack is a cloud-based communication platform designed to streamline team collaboration. It offers real-time messaging, organized channels, and a wide range of integrations, making it a popular tool for businesses of all sizes. By integrating AI into Slack, you can enhance its core functionalities with advanced automation and data-driven insights.
## Benefits of Integrating Slack with AI
By integrating generative AI into Slack, your team can:
- **Automate responses**: Use AI to generate automatic responses to frequently asked questions, allowing your team to focus on more complex tasks.
- **Generate content**: Leverage generative AI to draft messages, reports, or summaries directly within Slack, speeding up content creation.
- **Real-time language translation**: With AI, you can instantly translate messages into multiple languages, making cross-border communication seamless.
- **Sentiment analysis**: Analyze team conversations with AI to gauge sentiment, track engagement, and improve team dynamics.
- **Task automation**: Integrate AI-powered task management to automatically assign, update, and track tasks based on conversation context.
## How to Set Up Slack AI Integrations
### 1. Slack AI Integration for Workflow Automation
Integrate Slack with AI to automate repetitive tasks. AI-powered bots can help with task management, reminders, and more, allowing your team to stay focused on high-priority work.
### 2. Using Slack AI Integration for Natural Language Processing (NLP)
With AI-driven NLP tools, Slack becomes even more intuitive. Your team can interact with bots in natural language, generating more accurate and conversational responses.
### 3. Boost Productivity with Slack AI Integration
AI-powered tools in Slack can help draft messages, reports, and summaries, drastically improving productivity by reducing the time spent on manual writing tasks.
### 4. Enhance Customer Support with Slack AI Integration
Integrate AI chatbots into your Slack channels to streamline customer support. AI can handle common queries, freeing up human agents to focus on more complex issues.
### 5. Real-time Analytics and Insights via Slack AI Integration
Generative AI can analyze conversations in real time, providing valuable insights on team dynamics, customer sentiment, and overall communication effectiveness. Use these insights to make data-driven decisions that improve productivity and collaboration.
## Explore More Slack AI Integration Use Cases
Integrating Slack with generative AI opens up a world of possibilities, from automating workflows to enhancing communication with AI-generated content. Here’s how other businesses are leveraging AI in Slack:
- Automating meeting notes and summaries.
- Generating creative ideas and brainstorming sessions with AI.
- Using AI-powered translation for global teams.
---
**Related Integrations:**
- [Google AI Integrations](https://botpress.com/integrations/google)
- [Microsoft Teams AI Integrations](https://botpress.com/integrations/microsoft-teams)
---
`,
  };

  constructor(private integrationTitle: string) {}

  public getPrompt(type: PromptType): string {
    return this.templates[type](this.integrationTitle);
  }
}
