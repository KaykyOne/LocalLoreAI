import type { InputMode, SessionMemory, SessionRecord, TurnRecord } from "./types.ts";

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function compact(text: string, maxLength: number): string {
  const cleaned = normalizeText(text).replace(/\s+/g, " ");
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function labelForUserMode(inputMode?: InputMode): string {
  if (inputMode === "story") {
    return "Jogador (historia)";
  }

  return "Jogador (acao)";
}

function summarizeTurns(turns: TurnRecord[], limit: number): string {
  if (turns.length === 0) {
    return "Nenhum evento recente.";
  }

  return turns
    .slice(-limit)
    .map((turn) => {
      const speaker = turn.role === "assistant" ? "Mestre" : labelForUserMode(turn.inputMode);
      return `- ${speaker}: ${compact(turn.content, 180)}`;
    })
    .join("\n");
}

export function buildMemory(session: SessionRecord): SessionMemory {
  const createdAt = new Date().toISOString();
  const setup = session.world?.traits.length
    ? session.world.traits.map((item) => `- ${compact(item, 160)}`).join("\n")
    : "- Mundo ainda nao configurado.";

  const campaignSummary = [
    "Setup inicial:",
    setup,
    "",
    "Marcos da campanha:",
    summarizeTurns(session.turns, 8),
  ].join("\n");

  const recentSummary = summarizeTurns(session.turns, 6);

  return {
    campaignSummary,
    recentSummary,
    updatedAt: createdAt,
  };
}
