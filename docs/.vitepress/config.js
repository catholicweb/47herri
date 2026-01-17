import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

import { read } from "./node_utils.js";
import { getJSONLD } from "./seo.js";

import { generateNav, locales } from "./navBar.js";
import { getFontCSS } from "./css.js";

const config = read("./pages/config.json");

export default defineConfig(async () => {
  const { preloads } = await getFontCSS(config.theme);
  return {
    head: [
      // Load google fonts
      ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" }],
      ...preloads,
      // Manifest and icons
      ["link", { rel: "manifest", href: "/manifest.json" }],
      ["link", { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }],
      ["script", { "data-goatcounter": config.dev?.goatcounter || "", defer: true, crossorigin: "anonymous", src: "//gc.zgo.at/count.js" }],
    ],
    locales: locales(config.languages),
    title: config.title,
    cleanUrls: true,
    description: config.description,
    themeConfig: {
      nav: await generateNav(config),
      config: config,
    },
    sitemap: {
      hostname: config.dev?.siteurl,
    },
    async transformHead({ pageData }) {
      const path = pageData.relativePath.replace(/\.md$/, "").replace(/\.html$/, "");
      return getJSONLD(pageData.frontmatter, config, path);
    },
    plugins: [tailwindcss()],
  };
});
