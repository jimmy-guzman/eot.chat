import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Dark mode via system preference
  conditions: {
    extend: {
      dark: "@media (prefers-color-scheme: dark)",
    },
  },

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
            _focus: { borderColor: "accent", outline: "none" },
            backgroundColor: "base-100",
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
          "accent": { value: { _dark: "#E8850A", base: "#E8850A" } },
          "accent-content": { value: { _dark: "#28211E", base: "#28211E" } },
          // Base surface layers
          "base-100": { value: { _dark: "#1A1614", base: "#E2EBE5" } },
          "base-200": { value: { _dark: "#241C19", base: "#F0EDE4" } },
          "base-300": { value: { _dark: "#3A302A", base: "#D4CEBC" } },
          "base-content": { value: { _dark: "#EDE8DF", base: "#1A1A1A" } },
          // Error — destructive actions
          "error": { value: { _dark: "#D4541A", base: "#D4541A" } },
          "error-content": { value: { _dark: "#F0EDE4", base: "#F0EDE4" } },
          // Primary — main interactive color
          "primary": { value: { _dark: "#E8850A", base: "#28211E" } },
          "primary-content": { value: { _dark: "#28211E", base: "#F0EDE4" } },
          // Secondary — supporting interactive color
          "secondary": { value: { _dark: "#2D7A6A", base: "#2D7A6A" } },
          "secondary-content": { value: { _dark: "#F0EDE4", base: "#F0EDE4" } },
          // Palette tokens — non-semantic, reference only
          "terminal-green": { value: { _dark: "#4A8A5E", base: "#3D6B4A" } },
          "walnut": { value: { _dark: "#6B4E2E", base: "#8C6E4A" } },
        },
        radii: {
          full: { value: "9999px" },
          lg: { value: "12px" },
          md: { value: "8px" },
          sm: { value: "4px" },
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
          display: { value: "0.02em" },
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
