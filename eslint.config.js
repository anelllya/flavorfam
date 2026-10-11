import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Guardrails for generated code. Every rule here exists because an agent did it at least once.
const guardrails = [
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'GUARDRAIL no-inline-style: style via a component prop or a CSS module that uses tokens.',
  },
  {
    selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]',
    message: 'GUARDRAIL no-raw-color: colours live in tokens/tokens.json only.',
  },
  {
    selector: "MemberExpression[object.name='window'][property.name='location']",
    message: 'GUARDRAIL use-router: navigate with <Link> or useNavigate(), never window.location. (Added after run 1.)',
  },
  {
    selector: 'JSXText[value=/[A-Za-z]/]',
    message: 'GUARDRAIL no-hardcoded-copy: UI text goes through t() from src/i18n.',
  },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-syntax': ['error', ...guardrails],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/data/*.json'], message: 'GUARDRAIL data-access: read data through src/data/index.ts.' },
          ],
        },
      ],
    },
  },
  {
    // Token gallery renders tokens dynamically; it may set style, but only to var(--token).
    files: ['src/site/SystemPage.tsx'],
    rules: { 'no-restricted-syntax': ['error', ...guardrails.filter((g) => !g.message.includes('no-inline-style'))] },
  },
  {
    files: ['src/data/index.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['scripts/**', 'evals/**', 'tests/**', '*.config.*'],
    languageOptions: { globals: globals.node },
  },
);
