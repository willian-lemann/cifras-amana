import { openai } from "@ai-sdk/openai";

/**
 * Shared OpenAI model instances for the Vercel AI SDK.
 * The `@ai-sdk/openai` provider auto-reads `OPENAI_API_KEY` from env.
 */

/** GPT-4o for text generation, vision analysis, and structured output */
export const textModel = openai("gpt-4o");

/** GPT-4o mini for lighter/faster text tasks */
export const textModelMini = openai("gpt-4o-mini");

/** GPT image-1.5 image generation model */
export const imageModel = openai.image("gpt-image-1.5");
