# Quiz Rules

- Quizzes attach to a **lesson** (`lessonType` becomes `quiz` if needed).
- Staff see correct answers; students never receive `correctOptionId`.
- Score = count of matching option ids / total questions; `percent` rounded.
- `passed` when `percent >= passThresholdPercent` (default **70**).
- `maxAttempts` `0` = unlimited; otherwise further submits return **409**.
- Active enrollment + published quiz lesson required to attempt.
