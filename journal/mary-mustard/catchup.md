# Wavelength — catch-up for a new Claude chat

Give this file to a fresh Claude session so it has context without re-explaining everything. Written 2026-10-22.

## What this is
**Wavelength** — a swim team management app, built by Mary Mustard for ENTR 5000 (an entrepreneurship/product class). Started as "Swim Practice AI," renamed to Wavelength in Sprint 2.
- Repo: `maryemustard/swim-practice-ai` (GitHub)
- Live app: https://web-production-203bb3.up.railway.app
- Stack: Next.js 16 (App Router), Prisma 7 + Postgres (Railway), Claude Sonnet 5 for generation (`@anthropic-ai/sdk`)
- Class Slack channel: `#26f-5000-jw-wavelength`

## What's actually built (Sprint 2)
- **Practice generation in the coach's own voice** — Claude writes full practices matching a specific coach's real notation/structure, learned from uploaded past practices (style examples), not a generic template.
- **Exact pace-group matching** — swimmers split into A/B groups that land on the *exact* same total time, by construction: same reps, same interval, the slower group swims a shorter (25-yard-step) distance. Matches how the real coach (Jonathan, head coach of Dawgs 1) actually writes sets by hand.
- **Stroke-correct drills** — won't put a backstroke drill in a breaststroke set (an early real bug, found by testing against Jonathan's real uploaded practices).
- **"Train the generator"** — a coach types a one-line correction in plain English, it's absorbed permanently into future generations for that group, no code change needed. Separate from a one-time "just for today" note (e.g. "120 minutes, work on butterfly") that doesn't persist.
- **Deterministic practice length** — if a length is set (today-note or standing instruction), the final cumulative-time number in the practice is forced to match exactly, not left to the model's approximate arithmetic.
- **Roster + times** (current vs. goal, per event, per swimmer), **goal meets** (with taper weeks), **team calendar**, an **"Ask about this group"** chat grounded in that group's real data, practice history/log, manual practice entry.
- Real evidence this was tested against: Jonathan's actual uploaded Dawgs 1 practices, not synthetic data.

## Sprint 3 (Oct 15–29) — in progress
Working under the course's **AI Mirror** protocol — a journal/evidence system where the AI gathers evidence and offers suggestions, but Mary writes her own reflections/goals (never generated for her). Her journal and evidence briefs live in this repo under `journal/mary-mustard/sprint-3/`.

**Mary's kickoff answers (her own words, in the journal):**
- Core uncertainty: worried the team-management features (attendance, goal tracking, etc.) might be a "vitamin, not a pill" — nice-to-have, not urgent — since coaches have tracked this manually forever.
- Test: show the project to a coworker-coach and get real feedback; persist if they'd actually use it, pivot/stop if no coach would.
- **Meaningful progress for Sprint 3**: identify 3 of the main pain points for coaches, and build them out on the site.

**Real evidence gathered so far** (all preserved verbatim in `journal/mary-mustard/sprint-3/`, not paraphrased):
- Two conversations with her professor, John Weatherford: (1) the "club sells to parents" framing — Wavelength isn't selling to one coach, it's selling to a club, and the pitch is what a coach using it can tell a parent; also the real example of **Will Foggin**, a coach's kid who built an Excel spreadsheet tracking ~70 swimmers' splits and calculated target paces by hand. (2) A concrete interview plan: visit ABSC practice locations (Ramsey, Summerhill, OAR) this week, aim for ~10 coaches across a few evenings, ask about current/past behavior ("how did you make practice today," "what's the toughest part," "how do you track goals/feedback") rather than hypotheticals ("would you use X").
- A conversation with Lydia, a fellow ABSC coach: real pain points — practices can feel confusing ("find the pattern" — a coach couldn't tell what the rep/distance pattern of a set was), inconsistent yardage philosophy between age groups (Super Pups is skill/technique-focused with low yardage; Dawgs 1 does heavy yardage, sometimes as much as Senior 2), and Lydia's own technique — working on one skill (e.g. streamline off every wall) until it's ingrained before moving to the next, which Mary found notable since she'd never seen a coach do it that way.

**Interview question set drafted** (reviewed, not yet finalized with John):
- "How'd you put together practice for your group today?" (opener)
- "Does that work well for you, or is it kind of a pain?"
- "What's the most annoying part of putting a practice together?"
- "After a meet, what do you actually do to follow up with your swimmers on it?"
- "How do you keep track of where each kid's at against their goal times?"
- "Do you track attendance at all, or just kind of know who's there?"
- Plus two of Mary's own, reviewed: "Are you ever disappointed that swimmers in your groups may not have the skillset you wish they did coming into your group?" (keep) and "How do you communicate with parents when they ask how their child is performing?" (keep, new angle). A third — "could practices be more streamlined for one outcome" — was flagged as too close to a hypothetical/leading question and reworded toward "how do you decide what each practice focuses on."

**Status as of 2026-10-22**: Mary is at Ramsey today talking to 3 coaches, capturing the conversations via voice memo (to transcribe and save afterward, same pattern as the other evidence).

## Working agreements worth knowing
- **Never write Mary's reflections, goals, or journal entries for her** — AI gathers evidence, offers labeled suggestions, asks questions. She writes the actual words.
- When she pastes a conversation transcript, preserve it verbatim (don't clean up filler words or "improve" it) unless she says otherwise — save it as its own dated file in `journal/mary-mustard/sprint-3/conversation-<timestamp>.md`, commit, push, and link the immutable GitHub URL back to her. Confirm attribution (who she was talking to) rather than guessing — she's corrected this before.
- Don't build speculative features ahead of the pain-point validation — the explicit plan (hers and John's) is: talk to coaches first, build based on what's actually highest-requested.
- 42 commits on `main` as of 2026-10-20; repo has 27 GitHub issues (6 epics from Sprint 2 research, scoped before this pain-point-driven direction — may need re-prioritizing once interview results are in).
