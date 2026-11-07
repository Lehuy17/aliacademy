# ALI English – Speaking Placement A1–B2

## Status

- Student-facing UI is published as `speaking.html`. Supports microphone recording per part, playback, replacement and download.
- The teacher folder and grading Google Sheet exist.
- The Drive/Sheets submission and AI assessment **will not work until Apps Script is deployed and configured**. The public config has a blank endpoint by design.
- Do not call an upload successful until the page displays a server-confirmed receipt.

## Existing ALI Google resources

- Drive folder: https://drive.google.com/drive/folders/1jKrAaDRZDR8QGXDPx7aAEiKUrYfV7RPk
- Grading Sheet: https://docs.google.com/spreadsheets/d/1ZKWMCOQsgG48JZ3mqeIt_kh9yg5w-UuoryCaxuHRjpo/edit

Both should remain private. Share only with authorized ALI teaching staff; use Viewer/Editor appropriately.

## Required administrator deployment

1. Sign into the Google account that owns the folder and Sheet.
2. Visit https://script.google.com/ and create a standalone Apps Script project named `ALI Speaking Receiver`.
3. Replace `Code.gs` with the complete file [ALI_Speaking_AppsScript.gs](./ALI_Speaking_AppsScript.gs).
4. Run `setupAliSpeaking()` in the editor and approve required Drive/Sheets/mail permissions. This binds the existing folder and Sheet and installs the score notification trigger.
5. Optional AI evaluation: add a script property `ALI_GEMINI_API_KEY` in **Project Settings → Script properties**. NEVER include this value in GitHub or frontend code. Without it, no AI scoring occurs.
6. **Security gate before public launch:** This basic Web App receiver has no trustworthy student authentication, rate limiting, or abuse controls. An anonymously accessible deployment can be abused to upload unwanted content to your Drive or consume AI quota. Put a validated authentication/anti-abuse gate in front of the receiver (for example, Firebase-authenticated server endpoint with limits) before enabling public submissions. Do not treat a shared browser token as a secret.
7. Once secured, deploy the receiver as a Web App with the appropriate execution identity and access settings. Get the deployment URL ending `/exec`.
8. Set `uploadEndpoint` in `ali-speaking-config.js` to the verified deployed URL and commit.
9. Test in a browser with a *throwaway recording*, verify it appears inside Drive, verify row and link in the Sheet, then enter scores in N–R + feedback U and set M to `Đã chấm` on one row. If the student gave an email, confirm it is sent. Check AI separately with consent and an authorized API key.

## Scoring

The teacher rubric uses five 0–5 criteria /25: fluency & coherence, grammar, vocabulary, pronunciation, and interaction. The optional Gemini review is a separate advisory estimate of **four audio-observable criteria /20** (interaction intentionally omitted). It is not a CEFR certificate or a replacement for teacher assessment.

## Privacy

- Student recordings can contain personal information. Explain retention and deletion policy to students.
- Consent for sending recordings to ALI is mandatory; consent for external AI evaluation is separate and optional.
- Treat recording URLs as private. Configure folder and Sheet permissions, and protect the receiver endpoint before accepting public uploads.
- Because recordings are held in browser memory before upload, closing or refreshing the page can lose drafts. Students can download their files as a backup.

## Known limits

- Secure HTTPS is required for microphone access.
- Some browsers produce `audio/webm`, others `audio/mp4`.
- Each part is capped at 7 MiB in the default implementation.
- The AI request can take time; errors or timeouts must not be mistaken for a teacher-issued result.
