// tools/loadLocalesNode.ts
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

async function readJson(file: string) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as Record<
      string,
      string
    >;
  } catch {
    return null;
  }
}

export async function loadLocalesNode(templateName: string, lang: string) {
  const candidates = [
    path.join(root, "templates", templateName, "locales", `${lang}.json`),
    path.join(
      root,
      "src",
      "templates",
      templateName,
      "locales",
      `${lang}.json`
    ),
    path.join(root, "src", "locales", `${lang}.json`),
    path.join(root, "locales", `${lang}.json`),
  ];
  let dict: Record<string, string> = {};
  for (const p of candidates) {
    const json = await readJson(p);
    if (json) dict = { ...dict, ...json };
  }
  return dict;
}
