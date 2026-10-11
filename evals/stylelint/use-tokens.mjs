// Custom stylelint rule: spacing, radius, type and motion must come from tokens.
// Allowed: var(--token), 0, auto, inherit-style keywords, %, fr, calc() built from tokens.
import stylelint from 'stylelint';

const ruleName = 'flavorfam/use-tokens';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (prop, value) => `GUARDRAIL use-tokens: "${prop}: ${value}" uses a raw value. Use a token (var(--space-*), var(--radius-*), var(--text-*)...).`,
});

const TOKENISED = /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|border-radius|font-size|font-family|font-weight|line-height|transition-duration|transition|animation-duration)(-|$)/;
const RAW_LENGTH = /(?<![\w-])-?\d*\.?\d+(px|rem|em|ms|s)\b/;
const BARE_NUMBER = /(?<![\w-])\d*\.?\d+(?![\w%-])/;

const rule = (enabled) => (root, result) => {
  if (!enabled) return;
  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    if (prop.startsWith('--') || !TOKENISED.test(prop)) return;
    const value = decl.value.replace(/var\([^)]*\)/g, '');
    const offending =
      RAW_LENGTH.test(value) ||
      (/^(font-weight|line-height)$/.test(prop) && BARE_NUMBER.test(value)) ||
      (prop === 'font-family' && !/^\s*(inherit)?\s*$/.test(value));
    if (offending) {
      stylelint.utils.report({ ruleName, result, node: decl, message: messages.rejected(prop, decl.value) });
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
export default stylelint.createPlugin(ruleName, rule);
