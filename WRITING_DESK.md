# Personal writing desk

The home screen is the writing workspace. Books open directly in a chapter editor; new books include an empty first chapter. Sketches and poems are independent documents. Existing universes, characters, relationships, notes, branching chapters, cards and board games remain available from the workspace.

The rich editor includes headings, lists, quotes, alignment, fonts, sizes, color, tables, uploaded images, undo/redo, find/replace, focus mode, word targets, TXT/HTML export and browser PDF printing. It does not implement the Apple Pages file format, DOCX interchange, tracked changes, or exact printed pagination. Existing chapter text is preserved and opened as plain text; legacy markup remains literal in the new editor until edited. The older chapter studio still renders that markup.

## Access

- The owner signs in with the existing Convex `ADMIN_PASSWORD` setting. Existing owner sessions remain compatible; new session tokens use cryptographic randomness.
- There is no public content API. `convex/access.ts` wraps legacy content queries and mutations as well as new notebook operations. Custom bearer sessions are verified in the database; this app does not use JWT/`ctx.auth` authentication.
- Only the owner creates reader invitations. Links are random, stored as hashes, expire after seven days, and can be redeemed once. Reader sessions expire after thirty days. Revocation invalidates existing sessions immediately.
- Readers can read books and explicitly shared sketches/poems. They cannot create or edit content. Sketches and poems are private by default. Old writer sessions do not grant access to the private APIs.
- Invitation links are displayed for the owner to send; the app does not send email.
- Search indexing and content-based public metadata are disabled.

## Saving

Edits are debounced and written to Convex, with a local recovery copy recorded on every change. Writes are serialized and use revision checks, so another tab cannot silently overwrite newer text. If a recovery copy exists, the editor offers restore, download, and discard actions. `Ctrl/Cmd+S` saves immediately. Legacy chapter edits increment the revision and clear stale rich-text content.

Local recovery belongs to the current browser and device. The server remains the source for saved documents. The UI shows network and saving state; a stale revision must be resolved by preserving the local copy and reopening the server version.

## Validation

```sh
npm test
npm run typecheck
npm run build
npx convex dev --once
```

The opt-in live smoke test runs only against a configured **development** deployment. Start `npm run dev -- --port 3101`, install Chromium with `npx playwright install chromium`, and run `npm run test:live`. It reads the configured owner credential without printing it, creates temporary content, verifies owner and reader flows, and cleans up its documents, invitation and sessions. Screenshots are written to ignored `artifacts/`.

## Release

Schema additions are backward compatible and preserve existing books and chapters. The private API change requires the new frontend: deploy frontend and Convex changes together. `npx convex dev --once` updates only the development deployment; production requires `npx convex deploy` and a matching frontend release configured with that production Convex URL. Do not point the new frontend at an older backend or leave the old frontend using the new private endpoints.
