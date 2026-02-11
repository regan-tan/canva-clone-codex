import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages', 'scripts'];
const errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    if (stat.isFile() && /\.js$|\.mjs$/.test(full)) {
      const content = readFileSync(full, 'utf8');
      if (content.includes('\t')) {
        errors.push(`${full}: tabs are not allowed`);
      }
    }
  }
}

for (const root of roots) walk(root);

if (errors.length > 0) {
  console.error('Lint failed:\n' + errors.join('\n'));
  process.exit(1);
}

console.log('Lint passed');
