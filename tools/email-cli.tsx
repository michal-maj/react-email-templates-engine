// file: tools/email-cli.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import React from "react";
import ReactDOMServer from "react-dom/server";
import chokidar from "chokidar";
import yargs from "yargs";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import juice from "juice";
import { jsx } from "@emotion/react";

// ---- Paths ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(ROOT, "src/templates");
const LOCALES_DIR = path.join(ROOT, "src/locales");
const MODELS_DIR = path.join(ROOT, "src/models");
const DIST_DIR = path.join(ROOT, "dist");

// ---- Helpers for SendGrid handlebars inside React ----
// Usage in JSX: <SG.Var name="first_name" />, <SG.If cond="showDiscount">...</SG.If>
export const SG = {
  Var: ({ name }) => `{{${name}}}`,
  If: ({ cond, children }) =>
    `{{#if ${cond}}}${renderChildren(children)}{{/if}}`,
  Each: ({ list, children }) =>
    `{{#each ${list}}}${renderChildren(children)}{{/each}}`,
};
function renderChildren(children) {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(React.Fragment, null, children)
  );
  return html;
}

// ---- Loaders ----
async function listTemplates() {
  const dirs = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  return dirs
    .filter((d) => d.isFile() && d.name.endsWith(".tsx"))
    .map((d) => d.name.replace(/\.tsx$/, ""));
}

async function loadTemplateModule(templateName) {
  const modPath = path.join(TEMPLATES_DIR, templateName + ".tsx");
  // Dynamic import of ESM JSX: keep templates as .jsx ESM files
  return import(pathToFileURL(modPath));
}

function pathToFileURL(p) {
  const u = new URL(`file://${p}`);
  return u.href;
}

async function loadLocales(langs) {
  const out = {};
  for (const lang of langs) {
    const f = path.join(LOCALES_DIR, `${lang}.json`);
    const exists = await fileExists(f);
    out[lang] = exists ? JSON.parse(await fs.readFile(f, "utf8")) : {};
  }
  return out;
}

async function loadModel(templateName) {
  const f = path.join(MODELS_DIR, `${templateName}.json`);
  return (await fileExists(f)) ? JSON.parse(await fs.readFile(f, "utf8")) : {};
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---- Render ----
async function renderTemplate({ templateName, lang, extraModel = {} }) {
  const mod = await loadTemplateModule(templateName);
  // Support both default and named exports for Template and subject
  const Template = mod.Template || mod.default;
  const subject = mod.subject || (mod.default && mod.default.subject);
  if (!Template) {
    throw new Error(
      `Template component not found in ${templateName}. Export as 'export const Template' or 'export default'.`
    );
  }
  const locales = await loadLocales([lang]);
  const baseModel = await loadModel(templateName);
  const model = {
    ...baseModel,
    ...extraModel,
    lang,
    t: (key) => locales[lang]?.[key] ?? key,
  };

  // 1) Create a dedicated Emotion cache for server-side rendering
  const cache = createCache({ key: "email" });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  // 2) Render with Emotion’s CacheProvider
  const tree = jsx(CacheProvider, {
    value: cache,
    children: jsx(Template, { lang }),
  });

  const bodyHtml = ReactDOMServer.renderToStaticMarkup(tree);

  // 3) Pull out the critical CSS and build <style> tags
  const chunks = extractCriticalToChunks(bodyHtml);
  const styleTags = constructStyleTagsFromChunks(chunks); // <style data-emotion...>...</style>

  // 4) Compose a full HTML (tables, etc. are in your components)
  const withStyles = `<!doctype html>
<html>
  <head><meta charset="utf-8"/>${styleTags}</head>
  <body>${bodyHtml}</body>
</html>`;

  // 5) Inline CSS for email clients; then strip <style> tags
  const inlined = juice(withStyles, {
    removeStyleTags: true, // ensures only inline styles remain
    applyAttributesTableElements: true,
    preserveImportant: true,
  });

  return {
    html: inlined,
    subject: typeof subject === "function" ? subject(model) : subject,
  };
}

async function writeOutput({ templateName, lang, html }) {
  await fs.mkdir(DIST_DIR, { recursive: true });
  const outPath = path.join(DIST_DIR, `${templateName}-${lang}.html`);
  await fs.writeFile(outPath, html, "utf8");
  return outPath;
}

// ---- Commands ----
async function cmdGenerate(argv) {
  const langs = (argv.langs ?? "en").split(",").map((s) => s.trim());
  const names =
    argv.name === "all" || !argv.name ? await listTemplates() : [argv.name];

  const results = [];
  for (const name of names) {
    for (const lang of langs) {
      const { html } = await renderTemplate({ templateName: name, lang });
      const out = await writeOutput({ templateName: name, lang, html });
      results.push(out);
    }
  }
  console.log(`Generated:\n${results.map((r) => " - " + r).join("\n")}`);
}

async function cmdDev(argv) {
  const port = Number(argv.port ?? 5173);
  await cmdGenerate(argv); // initial build

  chokidar
    .watch([TEMPLATES_DIR, LOCALES_DIR, MODELS_DIR], { ignoreInitial: true })
    .on("all", async () => {
      try {
        await clearImportCache();
        await cmdGenerate(argv);
        console.log("[dev] regenerated");
      } catch (e) {
        console.error("[dev] error:", e);
      }
    });

  const server = http.createServer(async (req, res) => {
    // very tiny static file server for dist
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    if (urlPath === "/index.html") {
      const templates = await listTemplates();
      const langs = (argv.langs ?? "en").split(",").map((s) => s.trim());
      const list = templates
        .flatMap((t) =>
          langs.map((l) => `<li><a href="/${t}/${l}.html">${t}/${l}</a></li>`)
        )
        .join("");
      const html = `<!doctype html><meta charset="utf-8"/><title>Email Preview</title><body><h1>Emails</h1><ul>${list}</ul></body>`;
      res.writeHead(200, { "content-type": "text/html" });
      res.end(html);
      return;
    }
    const filePath = path.join(DIST_DIR, decodeURIComponent(urlPath));
    if (await fileExists(filePath)) {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(await fs.readFile(filePath));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  server.listen(port, () =>
    console.log(`[dev] preview http://localhost:${port}`)
  );
}

async function clearImportCache() {
  // Clear ESM module cache for templates so edits are picked up
  // (Works in Node 20+ where import caches by file URL)
  // No-op here; for reliability, we append a query param cache-buster in loadTemplateModule if needed.
}

// ---- SendGrid ----
const SG_BASE = "https://api.sendgrid.com/v3";

async function sgFetch(pathname: string, init: RequestInit = {}) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY not set");
  const res = await fetch(`${SG_BASE}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}

/**
 * Deploys by creating a new version on an existing template ID,
 * or creates a template if --create is passed (returns the id).
 */
async function cmdDeploy(argv) {
  const { name, langs = "en", sgTemplateId, create } = argv;
  const langsArr = langs.split(",").map((s) => s.trim());
  const templates = name === "all" || !name ? await listTemplates() : [name];

  for (const t of templates) {
    // Prepare subject & HTML from primary lang (first)
    const primaryLang = langsArr[0];
    const { html, subject } = await renderTemplate({
      templateName: t,
      lang: primaryLang,
    });

    let templateId = sgTemplateId;
    if (create) {
      const created = await sgFetch("/templates", {
        method: "POST",
        body: JSON.stringify({ name: t, generation: "dynamic" }),
      });
      templateId = created.id;
      console.log(`[deploy] created SendGrid template ${t}: ${templateId}`);
    }
    if (!templateId) throw new Error("Provide --sgTemplateId or --create");

    const version = await sgFetch(`/templates/${templateId}/versions`, {
      method: "POST",
      body: JSON.stringify({
        name: `${t} ${new Date().toISOString()}`,
        subject: subject ?? "",
        html_content: html,
        plain_content: "",
        active: 1, // activate this version
      }),
    });
    console.log(
      `[deploy] ${t}: created version ${version.id} on template ${templateId}`
    );
  }
}

async function cmdUpdate(argv) {
  const { sgVersionId, name, langs = "en" } = argv;
  if (!sgVersionId) throw new Error("Require --sgVersionId to update");
  const primaryLang = langs.split(",")[0];

  const { html, subject } = await renderTemplate({
    templateName: name,
    lang: primaryLang,
  });
  await sgFetch(`/templates/versions/${sgVersionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      subject: subject ?? "",
      html_content: html,
      plain_content: "",
    }),
  });
  console.log(`[update] Updated version ${sgVersionId}`);
}

// ---- CLI ----
yargs(process.argv.slice(2))
  .command(
    "generate [name]",
    "Generate one or all templates",
    (y) =>
      y.positional("name", { type: "string", default: "all" }).option("langs", {
        type: "string",
        default: "en",
        desc: "comma-separated: en,pl,de",
      }),
    cmdGenerate
  )
  .command(
    "dev",
    "Live preview (regenerates on change)",
    (y) =>
      y
        .option("langs", { type: "string", default: "en" })
        .option("port", { type: "number", default: 5173 }),
    cmdDev
  )
  .command(
    "deploy [name]",
    "Create new SendGrid versions",
    (y) =>
      y
        .positional("name", { type: "string", default: "all" })
        .option("langs", { type: "string", default: "en" })
        .option("sgTemplateId", { type: "string" })
        .option("create", { type: "boolean", default: false }),
    cmdDeploy
  )
  .command(
    "update <name>",
    "Update an existing SendGrid version (by id)",
    (y) =>
      y
        .positional("name", { type: "string" })
        .option("langs", { type: "string", default: "en" })
        .option("sgVersionId", { type: "string", demandOption: true }),
    cmdUpdate
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
