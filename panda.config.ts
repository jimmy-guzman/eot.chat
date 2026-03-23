import { defineConfig, defineSlotRecipe } from "@pandacss/dev";

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
            paddingBlock: "1",
            paddingInline: "3",
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
            _focusVisible: { boxShadow: "glow.md", outline: "none" },
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
              block: {
                borderRadius: "sm",
                fontSize: "base",
                paddingBlock: "3",
                paddingInline: "5",
                width: "100%",
              },
              md: {
                borderRadius: "sm",
                fontSize: "base",
                paddingBlock: "3",
                paddingInline: "5",
              },
              sm: {
                borderRadius: "sm",
                fontSize: "xs",
                paddingBlock: "1",
                paddingInline: "3",
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
            borderRadius: "lg",
          },
          className: "card",
          defaultVariants: {
            variant: "default",
          },
          variants: {
            variant: {
              default: {
                boxShadow: "lg",
              },
              flat: {
                border: "1px solid token(colors.base-300)",
              },
            },
          },
        },
        input: {
          base: {
            _focusVisible: { boxShadow: "glow.md", outline: "none" },
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
        label: {
          base: {
            color: "base-content",
            display: "block",
            fontSize: "sm",
            fontWeight: "bold",
          },
          className: "label",
        },
      },
      semanticTokens: {
        colors: {
          // Accent — same as primary, one accent color
          "accent": { value: "#D44E1A" },
          "accent-content": { value: "#F5EEE0" },
          // Base surface layers
          "base-100": { value: "#0D0E10" },
          "base-200": { value: "#1A1410" },
          "base-300": { value: "#2C1E14" },
          "base-content": { value: "#E0D8C0" },
          // Muted text — base-content at 50% opacity, baked as a token
          "base-content-muted": { value: "rgba(224,216,192,0.5)" },
          // Error — destructive actions
          "error": { value: "#D44E1A" },
          "error-content": { value: "#F5EEE0" },
          // Primary — main interactive color
          "primary": { value: "#D44E1A" },
          "primary-content": { value: "#F5EEE0" },
          // Secondary — supporting interactive color
          "secondary": { value: "#3A3530" },
          "secondary-content": { value: "#E0D8C0" },
        },
        radii: {
          full: { value: "9999px" },
          lg: { value: "8px" },
          md: { value: "4px" },
          sm: { value: "2px" },
        },
      },
      slotRecipes: {
        menu: defineSlotRecipe({
          base: {
            item: {
              "&[data-highlighted]": {
                backgroundColor: "base-300",
                outline: "none",
              },
              "_focusVisible": { outline: "none" },
              "borderRadius": "sm",
              "color": "base-content",
              "cursor": "pointer",
              "display": "block",
              "fontSize": "sm",
              "fontWeight": "bold",
              "letterSpacing": "display",
              "padding": "2 3",
              "userSelect": "none",
              "width": "100%",
            },
            popup: {
              backgroundColor: "base-200",
              border: "1px solid token(colors.base-300)",
              borderRadius: "md",
              boxShadow: "md",
              minWidth: "10rem",
              padding: "1",
            },
            separator: {
              borderBottom: "1px solid token(colors.base-300)",
              margin: "1 0",
            },
            trigger: {
              "&[data-popup-open]": { backgroundColor: "base-300" },
              "_focusVisible": { boxShadow: "glow.md", outline: "none" },
              "_hover": { boxShadow: "sm" },
              "alignItems": "center",
              "backgroundColor": "transparent",
              "border": "2px solid token(colors.base-300)",
              "borderRadius": "sm",
              "color": "base-content",
              "cursor": "pointer",
              "display": "inline-flex",
              "justifyContent": "center",
              "padding": "1",
              "transition": "box-shadow 80ms ease-out",
            },
          },
          className: "menu",
          slots: ["item", "popup", "separator", "trigger"],
          variants: {
            variant: {
              danger: {
                item: { color: "error-content" },
              },
            },
          },
        }),
      },
      tokens: {
        colors: {
          // Palette tokens — non-semantic, reference only, never used in components
          "battleship": { value: "#6B6860" },
          "mauve-key": { value: "#8A6070" },
          "minitel-green": { value: "#4A7A3A" },
          "phosphor-olive": { value: "#B8A832" },
        },
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
          "glow.md": { value: "0 0 16px rgba(212,78,26,0.30)" },
          "glow.sm": { value: "0 0 6px rgba(212,78,26,0.20)" },
          "lg": { value: "0 8px 32px rgba(13,14,16,0.90)" },
          "md": { value: "0 4px 16px rgba(13,14,16,0.80)" },
          "sm": { value: "0 1px 4px rgba(13,14,16,0.60)" },
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
