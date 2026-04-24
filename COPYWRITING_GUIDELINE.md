# UI Copywriting Guideline

This guideline keeps all UI text consistent across the app.

## Core Rules

- Use **English only** for UI text.
- Use **Title Case** for page titles, section headings, nav labels, and button labels.
- Use **Sentence case** for helper text, descriptions, placeholders, alerts, and validation hints.
- Keep wording short and action-oriented.
- Prefer user-facing verbs like `Save`, `Submit`, `View`, `Create`, `Edit`, `Delete`, `Reset`.

## Terminology Standard

Use these terms consistently:

- `Exam` (not: test/ujian)
- `Exam Session` (for one running/completed exam run)
- `Attempt` / `Attempts` (for rows/history records)
- `Daily Activity`
- `Learning History`
- `Priority Practice`
- `Rankings`
- `Feedback`
- `Student`, `Lecturer`, `Admin`
- `Question Bank`
- `Score`, `Accuracy`, `Streak`

## Common UI Patterns

- Empty states:
  - `No data available.`
  - `No attempts for this filter.`
  - `No feedback has been submitted yet.`
- Details actions:
  - `View details`
  - `View details for {name}`
- Status labels:
  - `Completed`, `In Progress`, `Failed`, `Pending`
- Time/date labels:
  - `From date`, `To date`, `Saved at`

## Headings and Labels

- Good heading examples:
  - `Student Answer Monitoring`
  - `User Activity History`
  - `Exam Feedback`
- Good field label examples:
  - `Exam Session ID`
  - `Activity Type`
  - `Final Score`

## Buttons and CTA

- Keep labels concise:
  - `Create`, `Save`, `Submit`, `Apply Filters`, `Reset`, `Back`
- Avoid long sentence-like button text unless necessary.

## Placeholders and Helper Text

- Placeholders should be short:
  - `Search questions`
  - `Question keywords`
  - `Minimum 10 characters`
- Helper text should explain intent in one sentence when possible.

## Do / Don't

- Do: `Total Attempts`
- Don't: `Total Attempt`

- Do: `View details for John`
- Don't: `View detail John`

- Do: `Question Bank`
- Don't: mixed language terms like `bank soal`

- Do: `For essay and fill-in-the-blank questions, enter the reference answer in the Explanation field.`
- Don't: mixed Indonesian-English sentence structures.

## PR/Review Checklist (Copy)

Before merging UI changes:

- Is all new UI text in English?
- Are headings in Title Case?
- Are helper/description texts in sentence case?
- Are terms aligned with the terminology standard above?
- Are similar screens using the same labels for the same concept?
