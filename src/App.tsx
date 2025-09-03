import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import TemplatesIndex, { templateRoutes } from "./TemplatesIndex";
import { Suspense } from "react";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page lists all templates */}
        <Route
          path="/"
          element={
            <TemplatesIndex
              templates={templateRoutes.map(({ slug, title }) => ({
                slug,
                title,
              }))}
            />
          }
        />

        {/* Auto-generated routes for each template */}
        {templateRoutes.map(({ slug, Component }) => (
          <Route
            key={slug}
            path={`/templates/${slug}`}
            element={
              <Suspense fallback={<div>Loading…</div>}>
                <Component />
              </Suspense>
            }
          />
        ))}

        {/* Optional: redirect unknown paths to home */}
        <Route
          path="*"
          element={
            <TemplatesIndex
              templates={templateRoutes.map(({ slug, title }) => ({
                slug,
                title,
              }))}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
