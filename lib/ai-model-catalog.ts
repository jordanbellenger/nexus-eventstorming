export type ModelOption = {
  id: string;
  label: string;
  provider: "anthropic" | "openai" | "google" | "ollama";
  modelId: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "anthropic-claude-3-5-sonnet",
    label: "Anthropic / Claude 3.5 Sonnet",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-latest",
  },
  {
    id: "openai-gpt-4.1",
    label: "OpenAI / GPT-4.1",
    provider: "openai",
    modelId: "gpt-4.1",
  },
  {
    id: "google-gemini-2.5-pro",
    label: "Google / Gemini 2.5 Pro",
    provider: "google",
    modelId: "gemini-2.5-pro",
  },
  {
    id: "ollama-llama3.2",
    label: "Ollama / Llama 3.2",
    provider: "ollama",
    modelId: "llama3.2",
  },
];

export const DEFAULT_MODEL_OPTION_ID = "openai-gpt-4.1";

export function findModelOption(modelId: string | undefined) {
  return MODEL_OPTIONS.find((option) => option.id === modelId);
}
