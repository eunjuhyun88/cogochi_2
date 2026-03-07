import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const aimonRoot = path.join(root, 'src/lib/aimon');
const errors = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile() && fullPath.endsWith('.ts')) return [fullPath];
    return [];
  });
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function categoryFor(filePath) {
  const rel = toPosix(path.relative(root, filePath));
  if (rel === 'src/lib/aimon/types.ts') return 'types';
  if (rel.startsWith('src/lib/aimon/data/')) return 'data';
  if (rel.startsWith('src/lib/aimon/market/')) return 'market';
  if (rel.startsWith('src/lib/aimon/engine/')) return 'engine';
  if (rel.startsWith('src/lib/aimon/services/')) return 'services';
  if (rel.startsWith('src/lib/aimon/stores/')) return 'stores';
  return 'other';
}

function resolveImport(filePath, specifier) {
  if (!specifier.startsWith('.')) return null;
  return toPosix(path.resolve(path.dirname(filePath), specifier));
}

function readImports(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const matches = [...contents.matchAll(/from\s+['"]([^'"]+)['"]/g)];
  return matches.map((match) => match[1]);
}

function assertNoMatch(filePath, resolved, pattern, message) {
  if (resolved.includes(pattern)) {
    errors.push(`${toPosix(path.relative(root, filePath))}: ${message}`);
  }
}

const files = walk(aimonRoot);

for (const filePath of files) {
  const category = categoryFor(filePath);
  const imports = readImports(filePath);
  const relFile = toPosix(path.relative(root, filePath));
  const isStoreAwareService =
    relFile.endsWith('/services/trainingOrchestrator.ts') || relFile.endsWith('/services/fineTuneService.ts');

  for (const specifier of imports) {
    const resolved = resolveImport(filePath, specifier);
    if (!resolved) continue;

    assertNoMatch(filePath, resolved, '/src/routes/', 'AIMON internals must not import route files.');
    assertNoMatch(filePath, resolved, '/src/components/', 'AIMON internals must not import component files.');

    if (category === 'types' && resolved.includes('/src/lib/aimon/')) {
      errors.push(`${relFile}: types.ts must remain a leaf module without AIMON-relative imports.`);
    }

    if (category === 'data') {
      const allowed = resolved.includes('/src/lib/aimon/data/') || resolved.endsWith('/src/lib/aimon/types');
      if (!allowed) {
        errors.push(`${relFile}: data layer may only import data/* or types.ts.`);
      }
    }

    if (category === 'market') {
      assertNoMatch(filePath, resolved, '/src/lib/aimon/stores/', 'market layer must not import stores.');
      assertNoMatch(filePath, resolved, '/src/lib/aimon/services/', 'market layer must not import services.');
      assertNoMatch(filePath, resolved, '/src/lib/aimon/engine/', 'market layer must not import engine.');
    }

    if (category === 'engine') {
      assertNoMatch(filePath, resolved, '/src/lib/aimon/stores/', 'engine layer must not import stores.');
      assertNoMatch(filePath, resolved, '/src/lib/aimon/services/', 'engine layer must not import services.');
    }

    if (category === 'services' && !isStoreAwareService) {
      assertNoMatch(filePath, resolved, '/src/lib/aimon/stores/', 'service layer may only import stores from orchestrator services.');
    }
  }
}

if (errors.length > 0) {
  console.error('AIMON architecture check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AIMON architecture check passed.');
