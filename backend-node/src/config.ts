import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

function loadEnvFile(): void {
  const envPath = resolve(ROOT_DIR, ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile();

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: parsePort(process.env.PORT, 8000),
  pythonEngineUrl: process.env.PYTHON_ENGINE_URL ?? "http://localhost:8001",
  corsOrigins: parseOrigins(process.env.CORS_ALLOW_ORIGINS),
  dataDir: resolve(ROOT_DIR, process.env.DATA_DIR ?? "./data"),
  defaultSessionId: process.env.DEFAULT_SESSION_ID ?? "default",
};
