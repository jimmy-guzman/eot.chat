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
      recipes: {
        badge: {
          base: {
            borderRadius: "full",
            display: "inline-flex",
            fontFamily: "body",
            fontSize: "xs",
            fontWeight: "bold",
            lineHeight: "tight",
            padding: "1 3",
          },
          className: "badge",
          defaultVariants: {
            variant: "default",
          },
          variants: {
            variant: {
              active: {
                backgroundColor: "cobalt",
                color: "surface",
              },
              default: {
                backgroundColor: "lavender",
                color: "ink",
              },
            },
          },
        },
        button: {
          base: {
            _disabled: { cursor: "not-allowed", opacity: 0.5 },
            alignItems: "center",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            fontFamily: "body",
            fontWeight: "bold",
            justifyContent: "center",
            letterSpacing: "display",
            transition: "box-shadow 0.15s ease",
          },
          className: "button",
          defaultVariants: {
            size: "md",
            variant: "primary",
          },
          variants: {
            size: {
              md: {
                borderRadius: "full",
                fontSize: "sm",
                padding: "2 5",
              },
              sm: {
                borderRadius: "full",
                fontSize: "xs",
                padding: "1 3",
              },
            },
            variant: {
              danger: {
                _hover: { boxShadow: "md" },
                backgroundColor: "red",
                color: "surface",
              },
              ghost: {
                _hover: { boxShadow: "sm" },
                backgroundColor: "transparent",
                border: "2px solid token(colors.soft-pink)",
                color: "ink",
              },
              primary: {
                _hover: { boxShadow: "md" },
                backgroundColor: "cobalt",
                color: "surface",
              },
              secondary: {
                _hover: { boxShadow: "md" },
                backgroundColor: "mint",
                color: "ink",
              },
            },
          },
        },
        card: {
          base: {
            backgroundColor: "surface",
            borderRadius: "md",
          },
          className: "card",
          defaultVariants: {
            variant: "default",
          },
          variants: {
            variant: {
              default: {
                boxShadow: "sm",
              },
              flat: {
                border: "1px solid token(colors.soft-pink)",
              },
            },
          },
        },
        input: {
          base: {
            _focus: { borderColor: "cobalt", outline: "none" },
            backgroundColor: "bg",
            border: "2px solid token(colors.soft-pink)",
            borderRadius: "sm",
            color: "ink",
            fontFamily: "body",
            fontSize: "base",
            padding: "3",
            width: "100%",
          },
          className: "input",
        },
      },
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
          "surface": { value: "#FFFEF7" },
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
        fontSizes: {
          "2xl": { value: "2rem" },
          "base": { value: "1rem" },
          "lg": { value: "1.25rem" },
          "sm": { value: "0.875rem" },
          "xl": { value: "1.5rem" },
          "xs": { value: "0.75rem" },
        },
        fontWeights: {
          bold: { value: "700" },
          extrabold: { value: "800" },
          regular: { value: "400" },
        },
        letterSpacings: {
          display: { value: "0.01em" },
          tight: { value: "-0.01em" },
        },
        lineHeights: {
          body: { value: "1.65" },
          code: { value: "1.6" },
          tight: { value: "1.2" },
        },
        shadows: {
          lg: { value: "0 8px 32px rgba(26,26,26,0.16)" },
          md: { value: "0 4px 16px rgba(26,26,26,0.12)" },
          sm: { value: "0 1px 4px rgba(26,26,26,0.08)" },
        },
        sizes: {
          bubble: { value: "480px" },
          card: { value: "400px" },
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
