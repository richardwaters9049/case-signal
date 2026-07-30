# Contributing to CaseSignal

Use short-lived feature branches and raise at least one focused pull request each week. Prefer small, reviewable changes over bulk updates.

Every pull request must explain the problem, implementation approach, test evidence, operational risk, rollback route and documentation changes. Include screenshots or a short recording for user-interface work.

Require one approval before merging. Changes to permissions, workflow transitions or data migrations require a second reviewer where possible. Review correctness, security and privacy impact, accessibility, tests, observability and maintainability. Do not merge with unresolved blocking feedback.

Merging to `main` requires passing CI, review approval and a green deployment smoke check. Hold a brief weekly engineering review to demonstrate progress, review failed-job or error signals, and agree the next milestone.

## Commit Messages

Use a scoped, imperative commit subject in this format:

```text
Feat/FullStack: add case intake and audit trail
Chore/Backend: configure Messenger retry transport
```

Use `Feat` for user-facing or functional delivery, `Fix` for defect correction, `Chore` for maintenance, and a scope that identifies the affected area such as `Frontend`, `Backend`, `FullStack`, `Docs` or `CI`.
