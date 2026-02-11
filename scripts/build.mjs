import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
writeFileSync(
  'dist/build-manifest.json',
  JSON.stringify({ builtAt: new Date().toISOString(), components: ['api', 'realtime', 'web', 'packages'] }, null, 2)
);

console.log('Build completed: dist/build-manifest.json');
