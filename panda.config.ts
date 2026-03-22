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
                backgroundColor: "primary",
                color: "primary-content",
              },
              default: {
                backgroundColor: "base-300",
                color: "base-content",
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
            transition: "box-shadow 80ms ease-out",
          },
          className: "button",
          defaultVariants: {
            size: "md",
            variant: "primary",
          },
          variants: {
            size: {
              md: {
                borderRadius: "sm",
                fontSize: "sm",
                padding: "2 5",
              },
              sm: {
                borderRadius: "sm",
                fontSize: "xs",
                padding: "1 3",
              },
            },
            variant: {
              danger: {
                _hover: { boxShadow: "md" },
                backgroundColor: "error",
                color: "error-content",
              },
              ghost: {
                _hover: { boxShadow: "sm" },
                backgroundColor: "transparent",
                border: "2px solid token(colors.base-300)",
                color: "base-content",
              },
              primary: {
                _hover: { boxShadow: "md" },
                backgroundColor: "primary",
                color: "primary-content",
              },
              secondary: {
                _hover: { boxShadow: "md" },
                backgroundColor: "secondary",
                color: "secondary-content",
              },
            },
          },
        },
        card: {
          base: {
            backgroundColor: "base-200",
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
                border: "1px solid token(colors.base-300)",
              },
            },
          },
        },
        input: {
          base: {
            _focus: { boxShadow: "glow.md", outline: "none" },
            backgroundColor: "base-200",
            border: "2px solid token(colors.base-300)",
            borderRadius: "sm",
            color: "base-content",
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
          // Accent — highlight and focus
          "accent": { value: "#7AAF6E" },
          "accent-content": { value: "#0C0B09" },
          // Base surface layers
          "base-100": { value: "#0C0B09" },
          "base-200": { value: "#1A1310" },
          "base-300": { value: "#2E2219" },
          "base-content": { value: "#E8E0D0" },
          // Palette tokens — non-semantic, reference only
          "battleship": { value: "#6B7270" },
          // Error — destructive actions
          "error": { value: "#CC4E18" },
          "error-content": { value: "#E8E0D0" },
          "lcd-yellow": { value: "#C8C44A" },
          "phosphor-green": { value: "#8AB87A" },
          // Primary — main interactive color
          "primary": { value: "#F5A800" },
          "primary-content": { value: "#0C0B09" },
          // Secondary — supporting interactive color
          "secondary": { value: "#CC4E18" },
          "secondary-content": { value: "#E8E0D0" },
          "walnut": { value: "#5E3D22" },
        },
        radii: {
          full: { value: "9999px" },
          lg: { value: "8px" },
          md: { value: "4px" },
          sm: { value: "2px" },
        },
      },
      tokens: {
        fonts: {
          body: { value: "var(--font-mono)" },
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
          bold: { value: "600" },
          extrabold: { value: "700" },
          regular: { value: "400" },
        },
        letterSpacings: {
          display: { value: "0.04em" },
          tight: { value: "-0.01em" },
        },
        lineHeights: {
          body: { value: "1.65" },
          code: { value: "1.6" },
          tight: { value: "1.2" },
        },
        shadows: {
          "glow.md": { value: "0 0 20px rgba(245,168,0,0.25)" },
          "glow.sm": { value: "0 0 8px rgba(245,168,0,0.15)" },
          "lg": { value: "0 8px 32px rgba(20,10,4,0.80)" },
          "md": { value: "0 4px 16px rgba(20,10,4,0.60)" },
          "sm": { value: "0 1px 4px rgba(20,10,4,0.40)" },
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
