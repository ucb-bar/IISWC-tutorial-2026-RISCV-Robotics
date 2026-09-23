import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tutorial } from "./src/data/tutorial.ts";

const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const metadataPlugin = (): Plugin => ({
  name: "tutorial-metadata",
  transformIndexHtml(html) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "EducationEvent",
      name: tutorial.title,
      description: tutorial.seo.description,
      startDate: tutorial.event.startDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url: tutorial.siteUrl,
      image: tutorial.socialImageUrl,
      location: {
        "@type": "Place",
        name: tutorial.event.location,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Boulder",
          addressRegion: "CO",
          addressCountry: "US",
        },
      },
      organizer: {
        "@type": "Organization",
        name: tutorial.affiliation,
      },
      contributor: tutorial.organizers.map((organizer) => ({
        "@type": "Person",
        name: organizer.name,
        affiliation: tutorial.affiliation,
      })),
      offers: {
        "@type": "Offer",
        url: tutorial.urls.iiswcRegistration,
        availability: "https://schema.org/InStock",
      },
    };

    const replacements: Record<string, string> = {
      "__PAGE_TITLE__": escapeAttribute(tutorial.seo.title),
      "__PAGE_DESCRIPTION__": escapeAttribute(tutorial.seo.description),
      "__OG_TITLE__": escapeAttribute(tutorial.seo.openGraphTitle),
      "__CANONICAL_URL__": escapeAttribute(tutorial.siteUrl),
      "__SOCIAL_IMAGE_URL__": escapeAttribute(tutorial.socialImageUrl),
      "__EVENT_DATE__": escapeAttribute(tutorial.event.date),
      "__EVENT_LOCATION__": escapeAttribute(tutorial.event.location),
      "__STRUCTURED_DATA__": JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
    };

    return Object.entries(replacements).reduce(
      (output, [token, value]) => output.replaceAll(token, value),
      html,
    );
  },
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "robots.txt",
      source: `User-agent: *\nAllow: /\n\nSitemap: ${tutorial.siteUrl}sitemap.xml\n`,
    });
    this.emitFile({
      type: "asset",
      fileName: "sitemap.xml",
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${tutorial.siteUrl}</loc>\n  </url>\n</urlset>\n`,
    });
  },
});

export default defineConfig({
  base: "./",
  plugins: [react(), metadataPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Two pages: the public tutorial site, and the attendee lab instructions
      // served offline from the tutorial router at http://10.42.0.1/tutorial/.
      input: {
        main: "index.html",
        instructions: "instructions.html",
      },
    },
  },
});
