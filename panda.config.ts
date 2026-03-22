import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Files to exclude
  exclude: [],

  // Global base styles
  globalCss: {
    "html, body": {
      fontFamily: "body",
    },
  },

  // Where to look for your css declarations
  include: [
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/app/**/*.{ts,tsx,js,jsx}",
  ],

  // The output directory for your css system
  outdir: "styled-system",

  // Whether to use css reset
  preflight: true,

  // Useful for theme customization
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          "bg": { value: "#FEFAE8" },
          "chartreuse": { value: "#C9EB8A" },
          "cobalt": { value: "#1A3ABF" },
          "ink": { value: "#1A1A1A" },
          "lavender": { value: "#D3B8E2" },
          "mint": { value: "#B6EDE6" },
          "orange": { value: "#F47B1F" },
          "powder-blue": { value: "#A9D9EC" },
          "red": { value: "#E8291C" },
          "sage": { value: "#5A8A6A" },
          "soft-pink": { value: "#F7C5D0" },
          "yellow": { value: "#F5E135" },
        },
        radii: {
          full: { value: "9999px" },
          lg: { value: "24px" },
          md: { value: "16px" },
          sm: { value: "8px" },
        },
      },
      tokens: {
        fonts: {
          body: { value: "var(--font-mplus)" },
        },
        shadows: {
          lg: { value: "0 8px 32px rgba(26,26,26,0.16)" },
          md: { value: "0 4px 16px rgba(26,26,26,0.12)" },
          sm: { value: "0 1px 4px rgba(26,26,26,0.08)" },
        },
        spacing: {
          1: { value: "4px" },
          2: { value: "8px" },
          3: { value: "12px" },
          4: { value: "16px" },
          5: { value: "24px" },
          6: { value: "32px" },
          8: { value: "48px" },
          10: { value: "64px" },
        },
      },
    },
  },
});
