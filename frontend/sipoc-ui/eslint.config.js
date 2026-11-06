// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/**", "coverage/**", "documentation/**", ".angular/**"] },
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": ["error", { type: "attribute", prefix: "app", style: "camelCase" }],
      "@angular-eslint/component-selector": ["error", { type: "element", prefix: "app", style: "kebab-case" }],
      // Modernization rules: existing code predates them, so they only warn until migrated.
      "@angular-eslint/prefer-inject": "warn",
      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Existing click handlers on non-interactive elements; tracked as warnings until fixed.
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
    },
  },
);
