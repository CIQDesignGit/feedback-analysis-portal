import type {
  DateRange,
  NegativeTag,
  PositiveTag,
  Sentiment,
  Status,
  Tag,
  UserRole,
} from "./types";

export const STATUSES: Status[] = ["new", "in_progress", "resolved", "dismissed"];

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Positive",
  negative: "Negative",
};

export const POSITIVE_TAGS: PositiveTag[] = [
  "accurate",
  "actionable",
  "clear_dollar_impact",
  "well_sourced",
  "saved_time",
  "easy_to_follow",
];

export const NEGATIVE_TAGS: NegativeTag[] = [
  "inaccurate_numbers",
  "outdated_data",
  "missing_context",
  "not_actionable",
  "wrong_scope",
  "too_long_unclear",
  "slow",
];

export const ALL_TAGS: Tag[] = [...POSITIVE_TAGS, ...NEGATIVE_TAGS];

export const TAG_LABEL: Record<Tag, string> = {
  accurate: "Accurate",
  actionable: "Actionable",
  clear_dollar_impact: "Clear dollar impact",
  well_sourced: "Well sourced",
  saved_time: "Saved time",
  easy_to_follow: "Easy to follow",
  inaccurate_numbers: "Inaccurate numbers",
  outdated_data: "Outdated data",
  missing_context: "Missing context",
  not_actionable: "Not actionable",
  wrong_scope: "Wrong scope",
  too_long_unclear: "Too long or unclear",
  slow: "Slow",
};

export function isPositiveTag(tag: Tag): tag is PositiveTag {
  return (POSITIVE_TAGS as Tag[]).includes(tag);
}

export const ROLES: UserRole[] = ["nam", "category_manager", "marketing_manager", "vp_ecommerce"];

export const ROLE_LABEL: Record<UserRole, string> = {
  nam: "NAM",
  category_manager: "Category Manager",
  marketing_manager: "Marketing Manager",
  vp_ecommerce: "VP Ecommerce",
};

export const RANGES: DateRange[] = ["7d", "30d", "all"];

export const RANGE_LABEL: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatShortDay(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00.000Z`),
  );
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function feedbackCode(id: string) {
  return id.replace(/^fb/, "FB-");
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
