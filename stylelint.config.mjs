// Guardrails for generated CSS. tokens.css is generated and is the only file allowed raw values.
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['./evals/stylelint/use-tokens.mjs'],
  ignoreFiles: ['src/styles/tokens.css', 'dist/**'],
  rules: {
    'color-no-hex': [true, { message: 'GUARDRAIL no-raw-color: use var(--color-*).' }],
    'color-named': ['never', { message: 'GUARDRAIL no-raw-color: use var(--color-*).' }],
    'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla', 'oklch', 'lab'], { message: 'GUARDRAIL no-raw-color: use var(--color-*).' }],
    'flavorfam/use-tokens': true,
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'declaration-no-important': true,
    'value-keyword-case': null,
  },
};
