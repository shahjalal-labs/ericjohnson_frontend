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
      // ✅ Allow using `any`
      "@typescript-eslint/no-explicit-any": "off",
 
      // ✅ Do NOT require types everywhere
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/typedef": "off",
 
      // ✅ Do not throw error if variable is unused
      "@typescript-eslint/no-unused-vars": "off",
 
      // (optional) allow implicit any parameters
      "@typescript-eslint/no-inferrable-types": "off",
    },
  },
 
];

export default eslintConfig;
