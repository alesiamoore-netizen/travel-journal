// Fail-closed emulator-only safety guard.
//
// Every test file and every prototype entry point in this directory MUST import this
// module before doing anything else. Importing it has a side effect: it throws
// immediately, synchronously, at import time, if any condition below is not met. There
// is no way to import this module and continue running against anything but a local
// emulator on a non-production project id.
//
// This is intentionally strict and intentionally has zero configuration surface for
// loosening it. If a legitimate need to change these conditions ever arises, that is a
// deliberate edit to THIS file, reviewed as such — never an environment variable that
// quietly bypasses it.

const PRODUCTION_PROJECT_ID = 'travel-journal-35449';

function fail(message) {
  // Thrown, not logged-and-continued — importing this module must be able to stop the
  // whole process before any Firebase SDK call is even constructed.
  throw new Error(`[emulator-guard] REFUSING TO RUN: ${message}`);
}

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!projectId) {
  fail('no project id found in GCLOUD_PROJECT / FIREBASE_PROJECT_ID / PROJECT_ID. ' +
    'This suite must be run via `firebase emulators:exec` (or an equivalent invocation) ' +
    'that sets one of these to a demo-* project id.');
}

if (projectId === PRODUCTION_PROJECT_ID) {
  fail(`project id equals the real production project id ("${PRODUCTION_PROJECT_ID}"). ` +
    'This suite must never run against the production project, under any circumstance.');
}

if (!projectId.startsWith('demo-')) {
  fail(`project id "${projectId}" does not start with "demo-". Firebase treats a ` +
    '"demo-*" project id specially: the Admin SDK and emulators refuse to attempt any ' +
    'real network call to production for a demo-* project, which is exactly the ' +
    'structural safety property this suite depends on. A non-demo-* id does not have ' +
    'that guarantee, even if it happens to also be unset in real Firebase.');
}

if (!firestoreHost) {
  fail('FIRESTORE_EMULATOR_HOST is not set. Without it, the Admin/client SDKs would ' +
    'attempt to reach real Firestore.');
}

const hostPattern = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;
if (!hostPattern.test(firestoreHost)) {
  fail(`FIRESTORE_EMULATOR_HOST ("${firestoreHost}") is not a local host:port. Refusing ` +
    'to trust a value that could point anywhere else.');
}

const suspiciousCredentialVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_TOKEN',
  'FIREBASE_SERVICE_ACCOUNT',
];
for (const varName of suspiciousCredentialVars) {
  if (process.env[varName]) {
    fail(`${varName} is set in this environment. A real service-account credential or ` +
      'CI token has no legitimate role in an emulator-only run — refusing to proceed ' +
      'while it is present, in case it would cause a client to silently prefer real ' +
      'credentials over the emulator.');
  }
}

// All checks passed. Exported for tests/prototypes that want to log or assert on the
// confirmed-safe values, rather than re-reading process.env themselves.
export const verifiedEmulatorEnv = Object.freeze({
  projectId,
  firestoreHost,
});
