export type ChatRole = "system" | "user" | "assistant";
export type InputMode = "action" | "story";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type WorldConfig = {
  traits: string[];
  createdAt: string;
};

export type TurnRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  inputMode?: InputMode;
  createdAt: string;
};

export type SessionMemory = {
  campaignSummary: string;
  recentSummary: string;
  updatedAt: string;
};

export type SessionRecord = {
  sessionId: string;
  title: string;
  world: WorldConfig | null;
  memory: SessionMemory;
  turns: TurnRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ProviderStatus = {
  message: string;
  provider: string;
  model: string;
};

export type SessionListItem = {
  sessionId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  preview: string;
};
