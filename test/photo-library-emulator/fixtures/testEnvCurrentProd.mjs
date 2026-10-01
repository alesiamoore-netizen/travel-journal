// Loads the VERBATIM CURRENT PRODUCTION rules (rules/firestore.current-production.rules)
// — never the canonical Photo Library architecture ruleset, and never the proposed
// variant. Used only by the owner-only Photo Library MVP tests, which must verify
// against what is actually deployed today, since the MVP's own plan states it requires
// zero rule changes relative to that live ruleset specifically.
import '../guard.mjs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let envPromise = null;

export function getCurrentProdRulesTestEnv() {
  if (!envPromise) {
    envPromise = initializeTestEnvironment({
      projectId: process.env.GCLOUD_PROJECT,
      firestore: {
        rules: fs.readFileSync(path.join(rootDir, 'rules', 'firestore.current-production.rules'), 'utf8'),
        host: process.env.FIRESTORE_EMULATOR_HOST.split(':')[0],
        port: Number(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1]),
      },
    });
  }
  return envPromise;
}
