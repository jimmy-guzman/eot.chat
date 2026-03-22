import { defineConfig } from "@jimmy.codes/eslint-config";

export default defineConfig({
  ignores: ["styled-system/**/*", ".agents/**/*"],
  overrides: [
    {
      files: ["**/next-env.d.ts"],
      rules: { "import-x/extensions": "off" },
    },
    {
      rules: {
        "no-inline-comments": [
          "error",
          { ignorePattern: String.raw`^\s*(TODO|FIXME):` },
        ],
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["lucide-react"],
                importNamePattern: "^[A-Z](?!.*Icon$)",
                message:
                  "Import the Icon-suffixed version instead (e.g., PlusIcon instead of Plus).",
              },
            ],
          },
        ],
      },
    },
  ],
});
