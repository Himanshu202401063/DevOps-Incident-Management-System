# Test Report

Real results only, one section per sprint, written at the end of the sprint (#58). The
[test plan](TEST_PLAN.md) says what is run; the [test cases](TEST_CASES.md) say what each test checks.

Every number names where it came from: a CI run link, or a local run with its date and commit.

## How to fill in a sprint

| Section | What to record | Where to find it |
| --- | --- | --- |
| Automated tests | Tests run, passed, failed, and skipped for the backend, frontend, and AI service | The CI run on `main` at the end of the sprint |
| Coverage | Backend line and branch coverage (JaCoCo); frontend statement, branch, and line coverage (Vitest) | The `backend-coverage` and `frontend-coverage` artifacts |
| Mutation | PIT mutation score on the transition and SLA classes, and the surviving mutants worth fixing | `./mvnw test-compile org.pitest:pitest-maven:mutationCoverage`, then `target/pit-reports/` |
| Test cases | Cases planned for the sprint: passed, failed, or not run, with reasons | [TEST_CASES.md](TEST_CASES.md) and the test results |
| Manual demo | The steps, Pass or Fail per step, and the Chrome and Firefox versions | The demo run |
| Defects | Bugs found in the sprint, with their issue links and status | GitHub issues labelled `bug` |
| Notes | What the results show, and what to improve next sprint | |

---

## Baseline, 17 October 2026

Measured before the Sprint 1 APIs merged, so later sprints have a starting point.

| Measure | Result | Source |
| --- | --- | --- |
| Frontend coverage | Statements 62.31% (43/69), branches 65.90% (58/88), functions 77.77% (21/27), lines 65.15% (43/66) | Local run of `npm run test:coverage` on `main` (`c1e5576`) with the coverage settings from the `ci/coverage` branch |
| Backend coverage | Not measured yet; JaCoCo arrives with the `ci/coverage` PR | — |

## Sprint 1 (ends Monday 19 October)

| Section | Result |
| --- | --- |
| Automated tests | |
| Coverage | |
| Mutation | |
| Test cases | |
| Manual demo | |
| Defects | |
| Notes | |

## Sprint 2 (ends Thursday 22 October)

| Section | Result |
| --- | --- |
| Automated tests | |
| Coverage | |
| Mutation | |
| Test cases | |
| Manual demo | |
| Defects | |
| Notes | |

## Sprint 3 (ends Sunday 25 October)

| Section | Result |
| --- | --- |
| Automated tests | |
| Coverage | |
| Mutation | |
| Test cases | |
| Manual demo | |
| Defects | |
| Notes | |
