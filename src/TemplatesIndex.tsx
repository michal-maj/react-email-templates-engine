import { lazy } from "react";
import { Link } from "react-router";

// Grab all template files. Each must default-export a React component.
const modules = import.meta.glob("./templates/*.tsx");

// Small helper: path => { slug, title }
function metaFromPath(path: string) {
  const file = path.split("/").pop() || "";
  const name = file.replace(/\.tsx$/, "");
  const slug = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const title = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return { slug, title };
}

// Build an array of route configs: slug, title, and a lazy component
// eslint-disable-next-line react-refresh/only-export-components
export const templateRoutes = Object.entries(modules).map(([path, loader]) => {
  const { slug, title } = metaFromPath(path);
  // Wrap to satisfy React.lazy’s expected shape
  const Component = lazy(async () => {
    const mod = await (
      loader as () => Promise<{ default: React.ComponentType<unknown> }>
    )();
    if (!mod || typeof mod.default !== "function") {
      throw new Error(
        `Template module '${path}' does not have a valid default export (React component).`
      );
    }
    return { default: mod.default };
  });
  return { slug, title, Component };
});

export type TemplateMeta = Pick<
  (typeof templateRoutes)[number],
  "slug" | "title"
>;

export default function TemplatesIndex({
  templates,
}: {
  templates: TemplateMeta[];
}) {
  if (!templates.length)
    return (
      <p>
        No templates found in <code>src/templates</code>.
      </p>
    );
  return (
    <main style={{ padding: 24 }}>
      <h1>Templates</h1>
      <ul>
        {templates.map(({ slug, title }) => (
          <li key={slug}>
            <Link to={`/templates/${slug}`}>{title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
