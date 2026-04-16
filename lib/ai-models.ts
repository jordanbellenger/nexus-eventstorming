import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import {
  DEFAULT_MODEL_OPTION_ID,
  findModelOption,
} from "@/lib/ai-model-catalog";

const ollama = createOpenAICompatible({
  name: "ollama",
  apiKey: process.env.OLLAMA_API_KEY || "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
});

export function resolveLanguageModel(selectedModelId?: string): {
  model: LanguageModel;
  selectedOptionId: string;
} {
  const option =
    findModelOption(selectedModelId) || findModelOption(DEFAULT_MODEL_OPTION_ID);

  if (!option) {
    throw new Error("No AI model options are configured.");
  }

  switch (option.provider) {
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not configured.");
      }

      return {
        model: anthropic(option.modelId),
        selectedOptionId: option.id,
      };
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured.");
      }

      return {
        model: openai(option.modelId),
        selectedOptionId: option.id,
      };
    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
      }

      return {
        model: google(option.modelId),
        selectedOptionId: option.id,
      };
    case "ollama":
      return {
        model: ollama(option.modelId),
        selectedOptionId: option.id,
      };
    default: {
      const neverOption: never = option.provider;
      throw new Error(`Unsupported AI provider: ${neverOption}`);
    }
  }
}
