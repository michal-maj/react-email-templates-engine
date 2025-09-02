import { createElement, Fragment, type ReactNode } from "react";
import ReactDOMServer from "react-dom/server";

interface SGVarProps {
  name: string;
}

interface SGIfProps {
  cond: string;
  children: ReactNode;
}

interface SGEachProps {
  list: string;
  children: ReactNode;
}

function renderChildren(children: ReactNode) {
  const html = ReactDOMServer.renderToStaticMarkup(
    createElement(Fragment, null, children)
  );
  return html;
}

export const SG = {
  Var: ({ name }: SGVarProps) => `{{${name}}}`,
  If: ({ cond, children }: SGIfProps) =>
    `{{#if ${cond}}}${renderChildren(children)}{{/if}}`,
  Each: ({ list, children }: SGEachProps) =>
    `{{#each ${list}}}${renderChildren(children)}{{/each}}`,
};
