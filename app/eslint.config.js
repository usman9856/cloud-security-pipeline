export default [
  {
    ignores: ["dist/**", "node_modules/**", "src/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
];
