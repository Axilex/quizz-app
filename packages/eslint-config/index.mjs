/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
  {
    files: ["**/*.ts", "**/*.vue"],
    languageOptions: {
      parser: (await import("vue-eslint-parser")).default,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
      vue: (await import("eslint-plugin-vue")).default,
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "vue/multi-word-component-names": "off",
      "vue/define-macros-order": "error",
      "vue/no-unused-refs": "error",
    },
  },
];
