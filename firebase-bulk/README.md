# ALI Academy — Bulk student onboarding (100–1,000 emails)

Google Sheet: https://docs.google.com/spreadsheets/d/1XBb9DVDc2tjb9f1wgjIk08wRrrZcWWK84r_PWH6FZgI/edit
Firebase project: `ali-english`

## Safety status
**Prepared, not deployed. No student accounts are created until an administrator deploys and enables this integration.** All admin SDK credentials remain on Firebase-managed servers; do not commit service accounts to GitHub.

## Deploy
1. Enable Firebase project's billing / Cloud Functions v2, Firestore, Authentication, and Secret Manager as needed.
2. Deploy the code in `index.js` using Firebase CLI from this directory. Example (after a Firebase project configuration is created): `firebase deploy --only functions:bulkProvisionStudents --project ali-english`.
3. Configure two Firebase Secret Manager secrets named `ALI_BULK_SYNC_KEY` (cryptographically random, same value in Apps Script properties) and `ALI_RESEND_API_KEY` (optional email provider API key). Configure environment variable `ALI_INVITE_FROM` as a verified sending address to enable invitation emails.
4. Open the Google Sheet → Extensions → Apps Script. Paste `ALI_Bulk_Sheets.gs`. Set Script properties `ALI_BULK_ENDPOINT` to the deployed Function URL and `ALI_BULK_SYNC_KEY` to the secret. Never place either value in a cell.
5. Run `runAliBulkSync` manually for a five-email pilot. Recheck Firebase Authentication and matching Firestore `users/{uid}`; test login and email invitation.
6. Only then optionally enable the 5-minute trigger from Sheet menu. Max 20 rows per execution; about 50 batches for 1,000 users. Review Firebase/Google service quotas.
7. Restrict Sheet sharing to trusted staff. The Function uses HMAC authentication and strict payload/time verification, but harden with rate-limiting, audit logging, and a replay-resistant job store before high-volume production use.

## Important behaviors
- Email-only rows are accepted, name and class optional.
- Existing Firebase users are not duplicated; missing student Firestore profiles are repaired.
- Existing non-student roles and disabled Firebase users are never automatically elevated/unblocked.
- No passwords are written to Sheets. Password setup links are generated and emailed using the configured verified sender (Resend).
- If email delivery is not configured, rows may show `DA_TAO` but invitation `CHUA_CAU_HINH_EMAIL`; students cannot sign in until a password is set by an approved process.
- Spreadsheet itself never contains passwords, reset links, or Firebase Admin credentials.
- A learner's status is only `active` when creating a missing Firestore profile. Existing status is respected.

## Rollout
Pilot: five consenting staff test emails. Verify Auth + Firestore + invitation. Then 20, 100, finally 1,000.
