// The gate. One command, every check, one report. CI runs exactly this.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

// EVAL_SKIP_VISUAL=1 (used in CI): screenshot baselines are made on macOS and fonts render
// differently on Linux, so CI runs every browser test except the visual diffs, and says so.
const skipVisual = process.env.EVAL_SKIP_VISUAL === '1';

const checks = [
  ['tokens', 'node scripts/build-tokens.mjs'],
  ['typecheck', 'npx tsc -b'],
  ['eslint guardrails', 'npx eslint .'],
  ['stylelint guardrails', 'npx stylelint "src/**/*.css"'],
  ['unit', 'npx vitest run'],
  ['build', 'npx vite build'],
  skipVisual
    ? ['axe + behaviour', 'npx playwright test --grep-invert visual']
    : ['axe + visual + behaviour', 'npx playwright test'],
];

const results = [];
for (const [name, cmd] of checks) {
  const started = Date.now();
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
  const pass = r.status === 0;
  results.push({ name, pass, ms: Date.now() - started, output: pass ? '' : (r.stdout + r.stderr).slice(-4000) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  (${Date.now() - started}ms)`);
  if (!pass) console.log((r.stdout + r.stderr).split('\n').slice(-40).join('\n'));
}

const ranAt = new Date().toISOString();
mkdirSync('evals', { recursive: true });
writeFileSync('evals/report.json', JSON.stringify({ ranAt, results }, null, 2));
// Public summary for the portfolio landing page (no logs, just pass/fail).
writeFileSync('src/site/eval-status.json', JSON.stringify({ ranAt, checks: results.map(({ name, pass }) => ({ name, pass })) }, null, 2) + '\n');

const failed = results.filter((r) => !r.pass).length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nGate passed.');
process.exit(failed ? 1 : 0);
