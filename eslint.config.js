import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslintEslintPlugin from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import _import from "eslint-plugin-import";
import jsxControlStatements from "eslint-plugin-jsx-control-statements";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
      "**/build/",
      "webpack.config.js",
      "workbox-config.js",
      "eslint.config.js",
      ".prettierrc.cjs"
    ],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-control-statements/recommended",
    "plugin:import/recommended",
    "./node_modules/gts",
)), {
    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslintEslintPlugin),
        "unused-imports": unusedImports,
        import: fixupPluginRules(_import),
        "jsx-control-statements": fixupPluginRules(jsxControlStatements),
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        "import/resolver": {
            typescript: {
                project: "src/",
            },
        }
    },

    rules: {
        // We hate unused imports.
        "unused-imports/no-unused-imports": "error",

        // We don't care about this here since we only use node for the webpack build.
        "n/no-unsupported-features/node-builtins": ["off", {
            "version": ">=21.0.0",
            "ignores": []
        }]
    },
}];
