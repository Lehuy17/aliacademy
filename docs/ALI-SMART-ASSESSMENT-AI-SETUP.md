# ALI Smart Assessment — AI Writing & Speaking setup (2026-11-25)

The repository now has two **server-side** AI integrations. They are not active until the account owner configures private API access and redeploys the corresponding Google Apps Script Web Apps. Never add credentials to GitHub or the website.

## 1. Writing AI (IELTS / TOEIC / B1)

**Google Sheet:** https://docs.google.com/spreadsheets/d/18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0/edit

**Correct project:** the existing **ALI Placement Results** Apps Script that serves IELTS, TOEIC, and B1. DO NOT paste this into the Firebase Spark account script, A1–A2 grading script, or Speaking audio receiver.

1. Replace its existing placement receiver code with `apps-script/ali-placement-results.gs`.
2. Add a **new second Script file** named `ali-writing-ai.gs`, copying `apps-script/ali-writing-ai.gs`.
3. Open Apps Script → Project Settings → Script Properties → add **`ALI_GEMINI_API_KEY`** with the secret API key (never in HTML or GitHub).
4. Run `aliPlacementSelfTest` and `aliWritingRubricSelfTest`; both should pass, and neither changes student records.
5. Run `aliPlacementHealthCheck` to verify the three Sheets and column layout.
6. Run `aliEnableWritingAi` once to install the per-minute worker. Running it again does not create duplicates. To disable new processing, run `aliDisableWritingAi`.
7. Deploy → Manage deployments → Edit existing Placement Web App → **New version** → Deploy, preserving the existing `/exec` endpoint.
8. Make a **consented test submission**, check the `AI Writing consent` column and queue status, then verify scored output and feedback.

**Sheet mapping:** IELTS consent S, Writing score I /100, feedback P, graded-at Q, status L; TOEIC consent T, Writing score M /10, feedback Q, status L; B1 consent S, Writing score I /15, feedback Q, status M.

**Privacy / safety:** AI is invoked only for submissions with the explicit opt-in checkbox checked and nonempty writing. Previous submissions without this new consent are not sent to AI. AI output is provisional; do not advertise official exam band scores. Never overwrite a score already entered by a teacher. Run `aliRunWritingQueue` manually if you want to test a pending submission. API errors mark rows for review without discarding originals. Queue scans the latest 250 rows per exam and processes at most two writings each minute, to limit quota usage.

## 2. Speaking AI (A1–B2 separate Speaking test)

**Correct project:** the dedicated **Speaking recordings** Apps Script, with `ALI_SPEAKING_FOLDER_ID`, `ALI_SPEAKING_SHEET_ID`, and `ALI_RESULTS_SHEET_ID` configured.

1. Replace the existing Speaking recordings receiver with `apps-script/ali-speaking-recordings.gs`. Do **not** overwrite the Placement Results or A1–A2 receiver.
2. Add `ALI_GEMINI_API_KEY` as a Script Property in **that** project as well.
3. Run `aliSpeakingAiSelfTest` (offline test with no Sheets writes or API call).
4. Deploy → Manage deployments → Edit existing Speaking Web App → **New version** → Deploy; keep the same upload URL.
5. On `/speaking/`, record a short sample, accept recording storage, optionally accept AI assessment, then submit. Wait for upload receipts and verify the AI score/feedback in **Speaking submissions** columns W, X, Y.

The audio is stored privately in Drive; with explicit AI consent, the worker transmits it server-to-server to Gemini. AI grades **fluency, grammar, vocabulary, pronunciation: /20**. The fifth criterion (**interaction /5**) cannot be assessed reliably from a one-way recording and is deliberately **not** fabricated. Scores are educational estimates, not certified CEFR ratings.

## 3. A1–A2 main test

A1–A2 currently submits to a **separate deployed receiver**. This rollout does **not** claim to have activated AI for its essay or its recording. Preserve that existing grading integration until its actual receiver can be audited and updated; AI consent and an authenticated result route will be required.

## 4. Production safeguards

- Keep Google Drive files private; never publish recordings or AI keys.
- Set API usage limits/billing alarms and monitor Apps Script Executions and Gemini errors.
- Run real-device testing on iPhone Safari and Android Chrome, including poor network and interrupted uploads.
- Keep one submission ID per test; never change existing formula columns when writing new scores.
- Before using AI grades for formal placement, calibrate the rubric against representative teacher-rated writing and audio samples.
