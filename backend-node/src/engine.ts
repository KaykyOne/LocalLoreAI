import type { ChatMessage, ProviderStatus } from "./types.ts";
import { config } from "./config.ts";

export async function fetchEngineStatus(): Promise<ProviderStatus> {
  const response = await fetch(`${config.pythonEngineUrl}/health`);
  if (!response.ok) {
    throw new Error(`Motor Python indisponivel: ${response.status}`);
  }

  return response.json() as Promise<ProviderStatus>;
}

export async function streamFromEngine(messages: ChatMessage[]): Promise<Response> {
  const response = await fetch(`${config.pythonEngineUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Falha no motor Python: ${response.status}`);
  }

  return response;
}
