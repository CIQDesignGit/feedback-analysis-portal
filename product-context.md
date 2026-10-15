# Product context

## What this is

Agent Feedback Dashboard is an internal tool for reading feedback on Ask Ally, the agentic conversational flow in RCA 2.0. While chatting with Ally, people rate an answer positive or negative, pick tags for what worked or didn't, write a comment, and can highlight the exact part of the answer they mean. Admins use this portal to see how Ally is doing overall, find recurring themes, and track individual feedback through to resolution. Ally's own chat UI is out of scope. This product is only the review surface.

The current app is a frontend prototype. Data is mock, held in memory for the browser session, and read or updated through one API module (`src/lib/api.ts`) so a real backend can replace it later. There is no auth, no database, and no live connection to the agent.

## The flow under review: Ask Ally

Ask Ally is the conversational flow people give feedback on. National Account Managers (NAMs) are the first users. Category Managers, Marketing Managers, and VPs of ecommerce use the same UI at a different tier.

NAMs live in spreadsheets and tabs. They want answers that lead with the dollar number and the next action.

Ally can do root-cause analysis on gap to plan (units versus price, dollars per issue) and give insights by tier: business, brand, category, SKU, and issue. People drill and pivot with chips. An answer can become a dashboard, a slide, or a recurring check. Every answer is traced to a crawl and a timestamp.

In the RCA 2.0 layout, chat is one of five sections: Home, Business Overview, Alerts, Trends, and Chat. The build spec assumes Ally may supersede the existing chat agents Blake (RCA) and Jessica (Content). That is unconfirmed.

**Status conflict, confirm with Product.** The June 2026 product box update says "Ask Ally removed" from Copilot packaging. The September docs (build spec and product context) treat it as active, and the spec describes a fixture-driven prototype with no live backend.

The seed data is 14 mock Ask Ally conversations (gap to plan, out-of-stock impact, Lost Buy Box, promo badges, drill-downs, slides, dashboards, recurring checks) from 8 users across the four roles, with 44 feedback records and 6 themes.

## Related: RCA Alerts

RCA Alerts (likely "Alerts Brain") is the issue-first flow in RCA 2.0, next to the top-down Insights drill-down. It is not the flow this dashboard reviews, but it sits beside Chat in the same layout. It starts from a grouped alert, ranks a SKU feed by dollar impact, and drills to a diagnosis: how bad, getting worse, why, and what to do. Source: RCA Alerts product context.

The April 2026 PRD lists 13 alert types across supply chain (OOS, Low DC Stock), PDP and promos (Lost Buy Box, Missing Promo Badge), reputation, digital shelf and conversion, traffic and media, and fulfillment. Severity tiers use a statistical IQR approach for abnormal moves.

## Who uses this dashboard

Admins on the team that owns Ally quality. They check how sentiment is trending, read the recurring themes, open individual feedback in its conversation, act on recommended actions, assign work, and track status.

Named assignees in the prototype: Maya Chen, Jordan Hale, Priya Shah, Alex Okonkwo. Feedback can also be unassigned. Changes made in the portal are attributed to "You".

## Workflows

1. **Check the overview.** Open `/`. Pick a date range (last 7 days by default, last 30 days, or all time). Read the headline numbers, sentiment over time, the top positive and negative tags, the AI-grouped themes, the negative feedback that needs attention, and the split by user role. Every number, tag, and theme links to the filtered log.
2. **Investigate in the log.** Open `/feedback`. Filter by sentiment, tags, status, assignee, role, theme, conversation, and date, or search. Filters live in the URL so a view can be shared. Select rows to assign or change status in bulk.
3. **Review one piece of feedback.** Open `/feedback/[id]`. Read the full conversation with every piece of feedback anchored in place. Accept or dismiss recommended actions, set status and assignee, and add notes. Step to the previous or next feedback in the same filtered view.

## Domain vocabulary

| Term | Meaning |
| --- | --- |
| User | The person chatting with Ally and leaving feedback. Has a name, a role, and an account (the brand they work for). |
| Role | `nam`, `category_manager`, `marketing_manager`, or `vp_ecommerce`. |
| Conversation | A thread with a title, the user who started it, a retailer, a start time, and messages. |
| Message | One turn. Role is `user` or `agent` (Ally). |
| Feedback | One rating on one Ally answer: sentiment, tags, comment, and an optional highlighted selection. |
| Sentiment | `positive` (thumbs up) or `negative` (thumbs down). Every feedback record has one. |
| Tag | What worked (positive: Accurate, Actionable, Clear dollar impact, Well sourced, Saved time, Easy to follow) or what didn't (negative: Inaccurate numbers, Outdated data, Missing context, Not actionable, Wrong scope, Too long or unclear, Slow). |
| Selection | The exact text the user highlighted in the answer. Empty means the feedback is about the whole answer. |
| Status | `new`, `in_progress`, `resolved`, or `dismissed`. |
| Recommended action | An AI-suggested next step for a feedback record, with a rationale and a suggested owner. It can be accepted, dismissed, or reopened. |
| Theme | An AI-grouped cluster of feedback with a label, sentiment, summary, and suggested action. |
| Activity | The timeline of a feedback record: submitted, assigned, status changes, actions, and notes. |

## Rules that affect the UI

- One feedback record is one row and one detail page. A conversation can have several, including two on the same answer.
- Only Ally's answers receive feedback. The user's messages are context.
- On the detail page, every feedback on the conversation is numbered in transcript order. Highlights appear inline. Whole-answer feedback outlines the answer. The record being viewed is shown in the brand color.
- Positive share is positive divided by all feedback in the range. Negative share is the remainder.
- Tag ranks count feedback with that tag as a share of feedback with the same sentiment, highest first. Tags with no feedback are omitted.
- Changes against the previous period compare with the same length of time just before the range. They are hidden for all time, or when the earlier period has no feedback.
- Date ranges are measured back from the day after the newest feedback, so the seed data always fills them.
- "Unassigned and open" means new or in progress with no assignee. "Needs attention" means negative feedback that is new or unassigned and open, at any date, newest first, top five.
- Accepting a recommended action on new feedback moves it to In progress. Every change appends to the activity timeline.
- Mark resolved sets status to `resolved`. Nothing is ever deleted.
- Log search matches the comment, the highlighted text, and the author's name. It does not match the whole transcript.
- The log is sorted newest first by default and shows 25 rows per page.
- AI-generated themes and recommended actions are always labelled as AI output.
- Empty, loading, and error states exist on every page. `?error=1` forces that page's load to fail so the error state can be opened. Retry removes that param.
- Edits persist while the tab stays open. A refresh restores the seed data.

## Screens

- **Overview** (`/`): range control, five headline numbers, sentiment over time, what's working and what's not, recurring themes, needs attention, and by user role.
- **Feedback log** (`/feedback`): toolbar filters, active filter chips, a sortable and paginated table, and bulk assign and status changes.
- **Feedback detail** (`/feedback/[id]`): the transcript with anchored feedback on the left. On the right: the feedback, other feedback on the conversation, recommended actions, tracking, and activity. Unknown ids show a not-found state.

`/summary` redirects to `/`, and `/items/[id]` redirects to `/feedback/[id]`.

The shell is the left nav and a top bar titled "Agent feedback" with Overview and Feedback log tabs.

## Out of scope

Ask Ally's chat UI, RCA Alerts, authentication, a real backend, a database, tests, Storybook, CI, internationalization, websockets, and a separate dark theme.
