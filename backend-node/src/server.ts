import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { config } from "./config.ts";
import { buildOpeningMessages, buildTurnMessagesWithMode } from "./context.ts";
import { fetchEngineStatus, streamFromEngine } from "./engine.ts";
import {
  appendTurn,
  createSessionId,
  deleteSession,
  listSessions,
  loadSession,
  resetSessionWorld,
  saveSession,
} from "./storage.ts";
import type { InputMode } from "./types.ts";

type StartWorldPayload = {
  traits?: string[];
  sessionId?: string;
};

type SendMessagePayload = {
  message?: string;
  sessionId?: string;
  mode?: InputMode;
};

function setCors(response: ServerResponse, origin?: string): void {
  const allowedOrigin =
    origin && config.corsOrigins.includes(origin) ? origin : config.corsOrigins[0] ?? "*";

  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown, origin?: string): void {
  response.statusCode = statusCode;
  setCors(response, origin);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendText(response: ServerResponse, statusCode: number, payload: string, origin?: string): void {
  response.statusCode = statusCode;
  setCors(response, origin);
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(payload);
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

async function handleStatus(response: ServerResponse, origin?: string): Promise<void> {
  try {
    const engine = await fetchEngineStatus();
    sendJson(
      response,
      200,
      {
        message: "pong",
        provider: engine.provider,
        model: engine.model,
        backend: "node",
      },
      origin,
    );
  } catch (error) {
    sendJson(
      response,
      502,
      {
        message: error instanceof Error ? error.message : "Falha ao consultar o motor Python.",
      },
      origin,
    );
  }
}

async function handleListSessions(response: ServerResponse, origin?: string): Promise<void> {
  const sessions = await listSessions();
  sendJson(response, 200, { sessions }, origin);
}

async function handleGetSession(request: IncomingMessage, response: ServerResponse, origin?: string): Promise<void> {
  const requestUrl = new URL(request.url ?? "", "http://localhost");
  const sessionId = requestUrl.searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    sendJson(response, 400, { message: "sessionId e obrigatorio." }, origin);
    return;
  }

  const session = await loadSession(sessionId);
  if (!session.world && session.turns.length === 0) {
    sendJson(response, 404, { message: "Sessao nao encontrada." }, origin);
    return;
  }

  sendJson(response, 200, { session }, origin);
}

async function handleDeleteSession(request: IncomingMessage, response: ServerResponse, origin?: string): Promise<void> {
  const requestUrl = new URL(request.url ?? "", "http://localhost");
  const sessionId = requestUrl.searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    sendJson(response, 400, { message: "sessionId e obrigatorio." }, origin);
    return;
  }

  await deleteSession(sessionId);
  sendJson(response, 200, { message: "Sessao removida." }, origin);
}

async function streamEngineResponse(
  response: ServerResponse,
  upstream: Response,
  origin: string | undefined,
): Promise<string> {
  setCors(response, origin);
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");

  const reader = upstream.body?.getReader();
  if (!reader) {
    const text = await upstream.text();
    response.end(text);
    return text;
  }

  const decoder = new TextDecoder();
  let finalText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    finalText += chunk;
    response.write(chunk);
  }

  finalText += decoder.decode();
  response.end();
  return finalText.trim();
}

async function handleStartWorld(
  request: IncomingMessage,
  response: ServerResponse,
  origin?: string,
): Promise<void> {
  const payload = await readJsonBody<StartWorldPayload>(request);
  const sessionId = payload.sessionId?.trim() || createSessionId();
  const traits = (payload.traits ?? []).map((item) => item.trim()).filter(Boolean);

  if (traits.length === 0) {
    sendText(response, 400, "Voce precisa enviar pelo menos um trait para iniciar o mundo.", origin);
    return;
  }

  const session = await loadSession(sessionId);
  resetSessionWorld(session, traits);

  try {
    const upstream = await streamFromEngine(buildOpeningMessages(traits));
    response.setHeader("X-Session-Id", sessionId);
    const finalText = await streamEngineResponse(response, upstream, origin);
    appendTurn(session, "assistant", finalText);
    await saveSession(session);
  } catch (error) {
    sendText(
      response,
      502,
      error instanceof Error ? error.message : "Falha ao iniciar a aventura.",
      origin,
    );
  }
}

async function handleSendMessage(
  request: IncomingMessage,
  response: ServerResponse,
  origin?: string,
): Promise<void> {
  const payload = await readJsonBody<SendMessagePayload>(request);
  const sessionId = payload.sessionId?.trim() || config.defaultSessionId;
  const message = payload.message?.trim() ?? "";
  const mode: InputMode = payload.mode === "story" ? "story" : "action";

  if (!message) {
    sendText(response, 400, "A mensagem do jogador nao pode estar vazia.", origin);
    return;
  }

  const session = await loadSession(sessionId);
  if (!session.world) {
    sendText(response, 400, "Nenhuma campanha ativa. Inicie o mundo primeiro.", origin);
    return;
  }

  appendTurn(session, "user", message, mode);

  try {
    const upstream = await streamFromEngine(buildTurnMessagesWithMode(session, message, mode));
    const finalText = await streamEngineResponse(response, upstream, origin);
    appendTurn(session, "assistant", finalText);
    await saveSession(session);
  } catch (error) {
    sendText(
      response,
      502,
      error instanceof Error ? error.message : "Falha ao continuar a aventura.",
      origin,
    );
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;

  if (!request.url || !request.method) {
    sendText(response, 400, "Requisicao invalida.", origin);
    return;
  }

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    setCors(response, origin);
    response.end();
    return;
  }

  if (request.url === "/bot" && request.method === "GET") {
    await handleStatus(response, origin);
    return;
  }

  if (request.url === "/bot/sessions" && request.method === "GET") {
    await handleListSessions(response, origin);
    return;
  }

  if (request.url.startsWith("/bot/session?") && request.method === "GET") {
    await handleGetSession(request, response, origin);
    return;
  }

  if (request.url.startsWith("/bot/session?") && request.method === "DELETE") {
    await handleDeleteSession(request, response, origin);
    return;
  }

  if (request.url === "/bot/start_world" && request.method === "POST") {
    await handleStartWorld(request, response, origin);
    return;
  }

  if (request.url === "/bot/send_message" && request.method === "POST") {
    await handleSendMessage(request, response, origin);
    return;
  }

  sendJson(response, 404, { message: "Rota nao encontrada." }, origin);
});

server.listen(config.port, config.host, () => {
  console.log(`LocalLoreAI Node backend rodando em http://${config.host}:${config.port}`);
});
