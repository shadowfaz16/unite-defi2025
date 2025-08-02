import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Temporarily downgrade to warning
      "@typescript-eslint/no-unused-vars": "warn", // Downgrade unused vars to warnings
      "@typescript-eslint/no-empty-object-type": "warn", // Allow empty interfaces
    },
  },
];

export default eslintConfig;
