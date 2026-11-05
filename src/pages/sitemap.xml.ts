import type { APIRoute } from "astro";

// Páginas públicas que Google debe indexar. Si agregás una página nueva, sumala acá.
const pages = [
  { path: "/", priority: "1.0" },
  { path: "/blog/", priority: "0.8" },
  { path: "/advad/", priority: "0.8" },
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://angelus11.dev");
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map(
      (p) =>
        `  <url><loc>${new URL(p.path, base).href}</loc><lastmod>${lastmod}</lastmod><priority>${p.priority}</priority></url>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
