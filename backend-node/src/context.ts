import type { ChatMessage, InputMode, SessionRecord } from "./types.ts";

const MASTER_PROMPT = `
Voce e o mestre narrador de um RPG de texto estilo AI Dungeon.

Diretrizes:
- responda sempre em portugues brasileiro;
- escreva com clareza, tensao e progressao;
- preserve a logica do mundo e a continuidade entre turnos;
- nunca tome decisoes importantes no lugar do jogador;
- quando o jogador usar modo "acao", trate a entrada como tentativa direta do personagem dentro da cena;
- quando o jogador usar modo "historia", trate a entrada como uma alteracao canonica, adicao direta ou verdade narrativa que deve ser integrada ao mundo atual;
- descreva consequencias, riscos, descobertas e pressao dramatica;
- termine em aberto, com gancho claro para o proximo turno;
- evite repeticao, meta-comentario e respostas excessivamente longas.
`.trim();

function worldContext(session: SessionRecord): string {
  const traits = session.world?.traits ?? [];
  if (traits.length === 0) {
    return "Nenhum mundo configurado.";
  }

  return traits.map((item) => `- ${item}`).join("\n");
}

export function buildOpeningMessages(traits: string[]): ChatMessage[] {
  return [
    { role: "system", content: MASTER_PROMPT },
    {
      role: "system",
      content: `Contexto do mundo:\n${traits.map((item) => `- ${item}`).join("\n")}`,
    },
    {
      role: "user",
      content:
        "Abra a campanha com uma cena inicial forte. Comece com movimento, perigo ou misterio imediato. Apresente um gancho claro para a primeira acao do jogador.",
    },
  ];
}

export function buildTurnMessages(session: SessionRecord, playerAction: string): ChatMessage[] {
  const recentTurns = session.turns.slice(-8).map<ChatMessage>((turn) => ({
    role: turn.role,
    content:
      turn.role === "assistant"
        ? turn.content
        : `${turn.inputMode === "story" ? "[Modo historia]" : "[Modo acao]"} ${turn.content}`,
  }));

  return [
    { role: "system", content: MASTER_PROMPT },
    {
      role: "system",
      content: `Contexto do mundo:\n${worldContext(session)}`,
    },
    {
      role: "system",
      content: `Memoria persistente:\n${session.memory.campaignSummary}`,
    },
    {
      role: "system",
      content: `Estado recente:\n${session.memory.recentSummary}`,
    },
    ...recentTurns,
    {
      role: "user",
      content: `Acao do jogador:\n${playerAction.trim()}\n\nContinue a aventura respeitando a continuidade estabelecida.`,
    },
  ];
}

export function buildTurnMessagesWithMode(
  session: SessionRecord,
  playerInput: string,
  inputMode: InputMode,
): ChatMessage[] {
  const modeInstruction =
    inputMode === "story"
      ? "Entrada em modo historia: o jogador esta adicionando ou alterando a historia diretamente. Integre isso como fato canonico, de forma coerente, sem quebrar o tom nem a continuidade."
      : "Entrada em modo acao: o jogador esta descrevendo o que o personagem tenta fazer na cena atual. Narre resultado, reacao do mundo e consequencias.";

  const recentTurns = session.turns.slice(-8).map<ChatMessage>((turn) => ({
    role: turn.role,
    content:
      turn.role === "assistant"
        ? turn.content
        : `${turn.inputMode === "story" ? "[Modo historia]" : "[Modo acao]"} ${turn.content}`,
  }));

  return [
    { role: "system", content: MASTER_PROMPT },
    {
      role: "system",
      content: `Contexto do mundo:\n${worldContext(session)}`,
    },
    {
      role: "system",
      content: `Memoria persistente:\n${session.memory.campaignSummary}`,
    },
    {
      role: "system",
      content: `Estado recente:\n${session.memory.recentSummary}`,
    },
    {
      role: "system",
      content: modeInstruction,
    },
    ...recentTurns,
    {
      role: "user",
      content: `${inputMode === "story" ? "Historia" : "Acao"} do jogador:\n${playerInput.trim()}\n\nContinue a aventura respeitando a continuidade estabelecida.`,
    },
  ];
}
