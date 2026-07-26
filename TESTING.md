# Testing

100% test coverage is the goal — tests let you move fast, trust your instincts, and ship with confidence.

## Running tests

```
npm test
```

Runs every file in `tests/*.test.js` (via `tests/run.js`, plain Node — no test framework installed or required).

## Conventions

- **No framework.** Each file is a standalone Node script using `assert/strict`. A file "passes" if it runs to completion without throwing; the last line is a `console.log('... tests passed')`. Do not add Jest/Vitest/Mocha — this project is deliberately zero-build (no bundler, `<script src>` tags into a shared global scope), and a test framework would be the first devDependency in a repo that has none.
- **`tests/checklist-ui.test.js` is special.** `index.html` and the `*.js` module files (`core.js`, `audit-rules.js`, `audit-detail.js`, etc.) are non-module `<script>` globals, not real Node modules — they can't be `require()`'d and asserted against like `audit-rules.test.js` does. Instead this file concatenates the raw source of every UI-bearing file and runs regex assertions (`assert.match`/`assert.doesNotMatch`) against the text.
  - **This is fragile by construction.** A rename, reformat, or file split changes zero behavior but can still break these assertions — they're checking that a code *shape* exists somewhere in the concatenated text, not exercising real behavior in a DOM.
  - When splitting a file out of `index.html` (as happened with `audit-detail.js`, `core.js`, `backup.js`, `photo.js`), add the new file to the `source` array at the top of `checklist-ui.test.js`, then re-run the whole suite — don't assume the split didn't touch anything this file checks.
- **New client-side security/validation logic needs a test here.** Two examples already in the file: the Registrant-login gate on template delete, and the required-revision-fields check in the review wizard.

## What this suite can and can't verify

- **Can:** client-side logic — is a button gated behind `registrantSession?.user`, does a function check the right condition before writing, is a required `<input>` actually marked required.
- **Cannot:** whether the server actually enforces the same rule. Template delete, for example, is gated client-side by a login check, but the real authorization boundary is a Postgres RLS policy (`supabase/migrations/20260726010000_templates_delete_policy.sql`) that must be applied by hand in the Supabase SQL Editor — there is no migration-runner or CI step that verifies it's actually live on the database. **After creating a new Supabase project, or touching any RLS policy, manually re-verify in the SQL Editor that the delete policy from that migration is applied.** No automated test can catch a missed or reverted RLS policy.

## CI

`.github/workflows/test.yml` runs `npm test` on every push/PR to `main`.
