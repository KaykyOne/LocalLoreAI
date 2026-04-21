import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "./config.ts";
import { buildMemory } from "./memory.ts";
import type { InputMode, SessionListItem, SessionRecord, TurnRecord } from "./types.ts";

function sessionsDirPath(): string {
  return resolve(config.dataDir, "sessions");
}

function sessionFilePath(sessionId: string): string {
  return resolve(sessionsDirPath(), `${sessionId}.json`);
}

function deriveSessionTitle(traits: string[]): string {
  const worldTrait = traits.find((item) => item.toLowerCase().startsWith("mundo:"));
  const protagonistTrait = traits.find((item) => item.toLowerCase().startsWith("protagonista:"));

  const worldTitle = worldTrait?.split(":").slice(1).join(":").trim();
  const protagonistTitle = protagonistTrait?.split(":").slice(1).join(":").trim();

  if (worldTitle && protagonistTitle) {
    return `${protagonistTitle} · ${worldTitle.slice(0, 46)}`;
  }

  if (worldTitle) {
    return worldTitle.slice(0, 60);
  }

  return `Campanha ${new Date().toLocaleDateString("pt-BR")}`;
}

function createEmptySession(sessionId: string): SessionRecord {
  const now = new Date().toISOString();
  const session: SessionRecord = {
    sessionId,
    title: "Nova campanha",
    world: null,
    memory: {
      campaignSummary: "Nenhuma campanha iniciada.",
      recentSummary: "Nenhum evento recente.",
      updatedAt: now,
    },
    turns: [],
    createdAt: now,
    updatedAt: now,
  };

  return session;
}

export async function loadSession(sessionId: string): Promise<SessionRecord> {
  const path = sessionFilePath(sessionId);
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as SessionRecord;
    return {
      ...createEmptySession(sessionId),
      ...data,
      sessionId,
    };
  } catch {
    return createEmptySession(sessionId);
  }
}

export async function saveSession(session: SessionRecord): Promise<void> {
  const path = sessionFilePath(session.sessionId);
  await mkdir(sessionsDirPath(), { recursive: true });
  const normalized: SessionRecord = {
    ...session,
    memory: buildMemory(session),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(path, JSON.stringify(normalized, null, 2), "utf8");
}

export function appendTurn(
  session: SessionRecord,
  role: "user" | "assistant",
  content: string,
  inputMode?: InputMode,
): TurnRecord {
  const turn: TurnRecord = {
    id: crypto.randomUUID(),
    role,
    content,
    inputMode,
    createdAt: new Date().toISOString(),
  };
  session.turns.push(turn);
  return turn;
}

export function resetSessionWorld(session: SessionRecord, traits: string[]): void {
  const now = new Date().toISOString();
  const normalizedTraits = traits.map((item) => item.trim()).filter(Boolean);
  session.world = {
    traits: normalizedTraits,
    createdAt: now,
  };
  session.title = deriveSessionTitle(normalizedTraits);
  session.turns = [];
  session.updatedAt = now;
}

export function createSessionId(): string {
  return `session-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listSessions(): Promise<SessionListItem[]> {
  try {
    const entries = await readdir(sessionsDirPath(), { withFileTypes: true });
    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const sessionId = entry.name.replace(/\.json$/i, "");
          const session = await loadSession(sessionId);
          const preview = session.turns.at(-1)?.content || session.world?.traits[0] || "Sem eventos ainda.";

          return {
            sessionId: session.sessionId,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            preview: preview.slice(0, 120),
          } satisfies SessionListItem;
        }),
    );

    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await rm(sessionFilePath(sessionId), { force: true });
}
