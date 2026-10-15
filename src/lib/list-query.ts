import { ALL_TAGS, RANGES, ROLES, STATUSES } from "./format";
import type { DateRange, ListQuery, Sentiment, SortKey, Status, Tag, UserRole } from "./types";

type Params = { get(name: string): string | null };

function oneOf<T extends string>(values: readonly T[], value: string | null): T | undefined {
  return value && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function parseListQuery(params: Params): ListQuery {
  const tags = (params.get("tags") ?? "")
    .split(",")
    .filter((tag): tag is Tag => (ALL_TAGS as string[]).includes(tag));
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? undefined,
    sentiment: oneOf<Sentiment>(["positive", "negative"], params.get("sentiment")),
    tags: tags.length ? tags : undefined,
    status: oneOf<Status>(STATUSES, params.get("status")),
    assignee: params.get("assignee") ?? undefined,
    role: oneOf<UserRole>(ROLES, params.get("role")),
    theme: params.get("theme") ?? undefined,
    conversation: params.get("conversation") ?? undefined,
    range: oneOf<DateRange>(RANGES, params.get("range")),
    sort: oneOf<SortKey>(["newest", "oldest"], params.get("sort")),
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  };
}

export const FILTER_KEYS = [
  "q",
  "sentiment",
  "tags",
  "status",
  "assignee",
  "role",
  "theme",
  "conversation",
  "range",
] as const;

/** Builds `/feedback?…` from a query, dropping empty values. */
export function feedbackHref(query: ListQuery = {}) {
  const params = new URLSearchParams();
  for (const key of [...FILTER_KEYS, "sort", "page"] as const) {
    const value = query[key];
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const search = params.toString();
  return search ? `/feedback?${search}` : "/feedback";
}
