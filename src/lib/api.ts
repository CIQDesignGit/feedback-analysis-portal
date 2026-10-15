import { NEGATIVE_TAGS, POSITIVE_TAGS, ROLES, STATUS_LABEL } from "./format";
import { conversations, feedback, themes, tracking, users } from "./mock-data";
import type {
  ActionState,
  ActivityEvent,
  DateRange,
  Feedback,
  FeedbackDetail,
  FeedbackPatch,
  FeedbackRow,
  Kpi,
  ListQuery,
  ListResult,
  Overview,
  Tag,
  TagCount,
} from "./types";

export const ASSIGNEES = [
  "Maya Chen",
  "Jordan Hale",
  "Priya Shah",
  "Alex Okonkwo",
] as const;

export const UNASSIGNED = "unassigned";
export const PAGE_SIZE = 25;
const ACTOR = "You";
const DAY = 86_400_000;

const store = new Map(
  tracking.map((entry) => [
    entry.feedbackId,
    {
      status: entry.status,
      assignee: entry.assignee,
      actions: entry.actions.map((action) => ({ ...action })),
      activity: [...entry.activity],
    },
  ]),
);

const userById = new Map(users.map((user) => [user.id, user]));
const conversationById = new Map(conversations.map((item) => [item.id, item]));
const countByConversation = new Map<string, number>();
for (const item of feedback) {
  countByConversation.set(item.conversationId, (countByConversation.get(item.conversationId) ?? 0) + 1);
}

/** Ranges are measured back from the day after the newest feedback, so the seed data always fills them. */
const anchor = (() => {
  const newest = feedback.reduce((max, item) => (item.createdAt > max ? item.createdAt : max), "");
  const day = new Date(`${newest.slice(0, 10)}T00:00:00.000Z`);
  return day.getTime() + DAY;
})();

function rangeDays(range: DateRange) {
  return range === "7d" ? 7 : range === "30d" ? 30 : null;
}

function inWindow(iso: string, days: number | null, offset = 0) {
  if (days === null) return true;
  const time = new Date(iso).getTime();
  const end = anchor - offset * days * DAY;
  return time < end && time >= end - days * DAY;
}

export const THEME_OPTIONS = themes.map((theme) => ({ id: theme.id, label: theme.label }));

export function conversationTitle(id: string) {
  return conversationById.get(id)?.title ?? id;
}

function delay() {
  return new Promise((resolve) => {
    setTimeout(resolve, 280);
  });
}

function shouldFail() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("error") === "1"
  );
}

function tracked(id: string) {
  const entry = store.get(id);
  if (!entry) throw new Error("Tracking is missing for this feedback.");
  return entry;
}

function toRow(item: Feedback): FeedbackRow {
  const author = userById.get(item.authorId);
  const conversation = conversationById.get(item.conversationId);
  if (!author || !conversation) throw new Error("Feedback references missing data.");
  const entry = tracked(item.id);
  return {
    feedback: item,
    author,
    conversation: {
      id: conversation.id,
      title: conversation.title,
      retailer: conversation.retailer,
      startedAt: conversation.startedAt,
    },
    conversationFeedbackCount: countByConversation.get(item.conversationId) ?? 1,
    status: entry.status,
    assignee: entry.assignee,
    themeIds: themes.filter((theme) => theme.feedbackIds.includes(item.id)).map((theme) => theme.id),
  };
}

function matches(row: FeedbackRow, query: ListQuery) {
  const { feedback: item } = row;
  if (query.sentiment && item.sentiment !== query.sentiment) return false;
  if (query.tags?.length && !query.tags.some((tag) => item.tags.includes(tag))) return false;
  if (query.status && row.status !== query.status) return false;
  if (query.assignee) {
    if (query.assignee === UNASSIGNED ? row.assignee !== null : row.assignee !== query.assignee) return false;
  }
  if (query.role && row.author.role !== query.role) return false;
  if (query.theme && !row.themeIds.includes(query.theme)) return false;
  if (query.conversation && item.conversationId !== query.conversation) return false;
  if (query.range && !inWindow(item.createdAt, rangeDays(query.range))) return false;
  const text = query.q?.trim().toLowerCase();
  if (!text) return true;
  const haystack = [item.comment, item.selection?.quote ?? "", row.author.name].join(" ").toLowerCase();
  return haystack.includes(text);
}

function filteredRows(query: ListQuery) {
  const direction = query.sort === "oldest" ? 1 : -1;
  return feedback
    .map(toRow)
    .filter((row) => matches(row, query))
    .sort((a, b) => direction * a.feedback.createdAt.localeCompare(b.feedback.createdAt));
}

export async function listFeedback(query: ListQuery = {}): Promise<ListResult> {
  await delay();
  if (shouldFail()) throw new Error("Couldn't load feedback.");
  const rows = filteredRows(query);
  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(query.page ?? 1, lastPage);
  return {
    rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: rows.length,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getFeedback(id: string, query: ListQuery = {}): Promise<FeedbackDetail | null> {
  await delay();
  if (shouldFail()) throw new Error("Couldn't load this feedback.");
  const item = feedback.find((entry) => entry.id === id);
  if (!item) return null;
  const conversation = conversationById.get(item.conversationId);
  const conversationUser = conversation && userById.get(conversation.userId);
  if (!conversation || !conversationUser) return null;

  const listIds = filteredRows({ ...query, page: undefined }).map((row) => row.feedback.id);
  const index = listIds.indexOf(id);
  const entry = tracked(id);
  const row = toRow(item);

  return {
    ...row,
    conversation,
    conversationUser,
    siblings: feedback
      .filter((other) => other.conversationId === item.conversationId && other.id !== id)
      .map(toRow),
    actions: entry.actions.map((action) => ({ ...action })),
    activity: [...entry.activity].sort((a, b) => b.at.localeCompare(a.at)),
    themes: themes.filter((theme) => row.themeIds.includes(theme.id)),
    prevId: index > 0 ? listIds[index - 1] : null,
    nextId: index >= 0 && index < listIds.length - 1 ? listIds[index + 1] : null,
    position: index >= 0 ? index + 1 : null,
    listTotal: listIds.length,
  };
}

function log(id: string, type: ActivityEvent["type"], detail: string) {
  const entry = tracked(id);
  entry.activity.push({
    id: `${id}-e${entry.activity.length + 1}-${Date.now()}`,
    type,
    actor: ACTOR,
    at: new Date().toISOString(),
    detail,
  });
}

function applyPatch(id: string, patch: FeedbackPatch) {
  const entry = tracked(id);
  if (patch.status && patch.status !== entry.status) {
    entry.status = patch.status;
    log(id, "status", `Status changed to ${STATUS_LABEL[patch.status]}`);
  }
  if ("assignee" in patch && (patch.assignee ?? null) !== entry.assignee) {
    entry.assignee = patch.assignee ?? null;
    log(id, "assignee", entry.assignee ? `Assigned to ${entry.assignee}` : "Unassigned");
  }
  if (patch.note?.trim()) {
    log(id, "note", patch.note.trim());
  }
}

export async function updateFeedback(id: string, patch: FeedbackPatch) {
  await delay();
  if (!store.has(id)) throw new Error("This feedback no longer exists.");
  applyPatch(id, patch);
}

export async function bulkUpdate(ids: string[], patch: FeedbackPatch) {
  await delay();
  for (const id of ids) {
    if (store.has(id)) applyPatch(id, patch);
  }
}

export async function setActionState(feedbackId: string, actionId: string, state: ActionState) {
  await delay();
  const entry = tracked(feedbackId);
  const action = entry.actions.find((item) => item.id === actionId);
  if (!action) throw new Error("This action no longer exists.");
  action.state = state;
  if (state === "suggested") {
    log(feedbackId, "action", `Reopened: ${action.label}`);
    return;
  }
  log(feedbackId, "action", `${state === "accepted" ? "Accepted" : "Dismissed"}: ${action.label}`);
  if (state === "accepted" && entry.status === "new") {
    applyPatch(feedbackId, { status: "in_progress" });
  }
}

function kpi(current: number, previous: number, hasPrevious: boolean): Kpi {
  return { value: current, previous: hasPrevious ? previous : null };
}

function share(part: number, whole: number) {
  return whole === 0 ? 0 : part / whole;
}

function tagCounts(items: Feedback[], tags: Tag[]): TagCount[] {
  return tags
    .map((tag) => {
      const count = items.filter((item) => item.tags.includes(tag)).length;
      return { tag, count, share: share(count, items.length) };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function eachDay(startTime: number, endTime: number) {
  const days: string[] = [];
  for (let time = startTime; time < endTime; time += DAY) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

export async function getOverview(range: DateRange = "7d"): Promise<Overview> {
  await delay();
  if (shouldFail()) throw new Error("Couldn't load the overview.");
  const days = rangeDays(range);
  const current = feedback.filter((item) => inWindow(item.createdAt, days));
  const previous = days === null ? [] : feedback.filter((item) => inWindow(item.createdAt, days, 1));

  const count = (items: Feedback[], test: (item: Feedback) => boolean) => items.filter(test).length;
  const isNew = (item: Feedback) => tracked(item.id).status === "new";
  const isUnassignedOpen = (item: Feedback) => {
    const entry = tracked(item.id);
    return entry.assignee === null && (entry.status === "new" || entry.status === "in_progress");
  };
  const positive = current.filter((item) => item.sentiment === "positive");
  const negative = current.filter((item) => item.sentiment === "negative");
  const previousPositive = count(previous, (item) => item.sentiment === "positive");
  const previousNegative = count(previous, (item) => item.sentiment === "negative");

  const oldest = current.reduce((min, item) => (item.createdAt < min ? item.createdAt : min), "9999");
  const firstTime =
    days === null ? new Date(`${oldest.slice(0, 10)}T00:00:00.000Z`).getTime() : anchor - days * DAY;
  const dayList = current.length === 0 ? [] : eachDay(firstTime, anchor).map((date) => ({
    date,
    positive: count(positive, (item) => item.createdAt.startsWith(date)),
    negative: count(negative, (item) => item.createdAt.startsWith(date)),
  }));

  const currentIds = new Set(current.map((item) => item.id));
  const previousIds = new Set(previous.map((item) => item.id));
  const themeSummaries = themes
    .map((theme) => {
      const inRange = theme.feedbackIds.filter((id) => currentIds.has(id));
      const quotes = inRange
        .map((id) => feedback.find((item) => item.id === id)!)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 2)
        .map((item) => ({
          feedbackId: item.id,
          text: item.comment,
          author: userById.get(item.authorId)?.name ?? "",
        }));
      return {
        ...theme,
        count: inRange.length,
        previousCount: theme.feedbackIds.filter((id) => previousIds.has(id)).length,
        quotes,
      };
    })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);

  const needsAttention = feedback
    .filter((item) => item.sentiment === "negative" && (isNew(item) || isUnassignedOpen(item)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map(toRow);

  const roles = ROLES.map((role) => {
    const byRole = current.filter((item) => userById.get(item.authorId)?.role === role);
    return {
      role,
      positive: count(byRole, (item) => item.sentiment === "positive"),
      negative: count(byRole, (item) => item.sentiment === "negative"),
    };
  }).filter((entry) => entry.positive + entry.negative > 0);

  const hasPrevious = previous.length > 0;
  return {
    range,
    total: kpi(current.length, previous.length, hasPrevious),
    newCount: kpi(count(current, isNew), count(previous, isNew), hasPrevious),
    positiveShare: kpi(share(positive.length, current.length), share(previousPositive, previous.length), hasPrevious),
    negativeShare: kpi(share(negative.length, current.length), share(previousNegative, previous.length), hasPrevious),
    unassignedOpen: kpi(count(current, isUnassignedOpen), count(previous, isUnassignedOpen), hasPrevious),
    positive: positive.length,
    negative: negative.length,
    days: dayList,
    positiveTags: tagCounts(positive, POSITIVE_TAGS),
    negativeTags: tagCounts(negative, NEGATIVE_TAGS),
    themes: themeSummaries,
    needsAttention,
    roles,
  };
}
