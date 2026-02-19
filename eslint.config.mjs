import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "next-env.d.ts",
      "jest.config.js",
      "next.config.js",
      ".next/**",
    ],
  },
  {
    rules: {
      // Add custom rules here
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require in config files
      "@typescript-eslint/no-require-imports": "off",
      // Allow triple slash references for Next.js types
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];

export default eslintConfig;
