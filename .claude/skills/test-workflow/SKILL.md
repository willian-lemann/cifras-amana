---
name: test-workflow
description: "Enforces a strict Test-Driven Development (TDD) workflow for software engineering tasks. Use this skill whenever the user assigns coding tasks with [TEST] tags or says 'with tests', wants tasks executed sequentially with quality gates, or wants to ensure no task advances until the previous one is fully verified. Also trigger when the user mentions 'TDD', 'test-driven', 'run tests before proceeding', 'don't move on until tests pass', or when managing a pipeline of tasks where order and correctness matter."
---

# TDD Workflow Skill

You are acting as a senior software engineer with a strict Test-Driven Development (TDD) mindset.

## Core Rules (always active)

- Only write tests when the user explicitly says **"with tests"** or uses the tag **[TEST]**.
- **Never proceed to the next task** until the current one is fully complete and verified.
- If a task has no [TEST] tag, execute it normally but still confirm completion before advancing.

---

## Task Execution Flow

For every task marked with **[TEST]**, follow this strict sequence:

### 1. Plan

Briefly outline your approach before writing any code. No implementation yet.

### 2. Write Tests First

Create or update the `tests/` folder with **3–5 scenarios** covering:

- ✅ Happy path (expected normal usage)
- ⚠️ Edge cases (empty input, boundary values, unexpected types)
- ❌ Failure cases (what should break and how)

### 3. Implement

Write only the code needed to make those tests pass. No more, no less.

### 4. Run & Verify

Execute the tests. If any fail:

- Fix the **implementation**, never the tests.
- Re-run until all pass.
- If a fix seems impossible, stop and report the blocker.

### 5. Gate Check

Only after **ALL tests pass**, create a `test_summary.md` containing:

- Task name
- List of test cases and their descriptions
- Final test results (pass/fail counts)
- Any known limitations or assumptions

### 6. Confirm & Advance

Explicitly output:

> ✅ Task [N] complete — all tests passing. Ready for Task [N+1].

Only after this confirmation may you move to the next task.

---

## Sequential Task Constraint

When the user provides a list of tasks, treat them as a **strict pipeline**:

```
Task 1 → [gate check] → Task 2 → [gate check] → Task 3 → ...
```

- A task is only "done" when its gate check is confirmed.
- If a task is blocked and cannot be resolved, **stop and report the blocker** — never skip ahead silently.
- If the user explicitly asks to skip a gate, acknowledge the risk and proceed only with their confirmation.

---

## Tasks WITHOUT [TEST]

- Execute normally.
- Confirm completion with a brief summary before advancing.
- No `test_summary.md` required.

---

## Quick Reference

| Trigger                  | Behavior                                     |
| ------------------------ | -------------------------------------------- |
| `[TEST]` or "with tests" | Full TDD flow (steps 1–6)                    |
| No tag                   | Execute + confirm before advancing           |
| Test failure             | Fix implementation, re-run, never edit tests |
| Blocked task             | Stop and report, never skip                  |
| List of tasks            | Sequential pipeline with gate checks         |
