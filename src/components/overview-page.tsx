"use client";

import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@ciq-dev/ciq-design-system";
import { ArrowRight, Sparkles, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { LoadError } from "@/components/load-error";
import { SentimentIcon } from "@/components/sentiment-badge";
import { StatusBadge } from "@/components/status-badge";
import { TagList } from "@/components/tag-chip";
import { UNASSIGNED, getOverview } from "@/lib/api";
import {
  RANGES,
  RANGE_LABEL,
  ROLE_LABEL,
  TAG_LABEL,
  formatDateTime,
  formatPercent,
  formatShortDay,
} from "@/lib/format";
import { feedbackHref } from "@/lib/list-query";
import type { DateRange, Kpi, ListQuery, Overview, TagCount, ThemeSummary } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { cn } from "@/lib/utils";

const PERIOD: Record<DateRange, string> = {
  "7d": "previous 7 days",
  "30d": "previous 30 days",
  all: "",
};

export function OverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rangeParam = searchParams.get("range");
  const range: DateRange = (RANGES as string[]).includes(rangeParam ?? "") ? (rangeParam as DateRange) : "7d";
  const load = useCallback(() => getOverview(range), [range]);
  const { phase, data } = useQuery(searchParams.toString(), load);

  function setRange(next: string) {
    router.replace(next === "7d" ? "/" : `/?range=${next}`, { scroll: false });
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="type-heading text-fg-primary">Overview</h2>
          <p className="type-body max-w-2xl text-fg-secondary">
            {data ? headline(data) : "How people rate Ask Ally's answers, and what needs a reviewer."}
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger aria-label="Date range" className="h-9 w-44 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((value) => (
              <SelectItem key={value} value={value}>
                {RANGE_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {phase === "loading" ? <OverviewFallback /> : null}
      {phase === "error" ? <LoadError message="Couldn't load the overview." /> : null}
      {phase === "ready" && data ? <OverviewBody data={data} /> : null}
    </div>
  );
}

function headline(data: Overview) {
  if (data.total.value === 0) return `No feedback in the ${RANGE_LABEL[data.range].toLowerCase()}.`;
  const topNegative = data.negativeTags[0];
  const base = `${data.total.value} pieces of feedback, ${formatPercent(data.positiveShare.value)} positive.`;
  return topNegative
    ? `${base} The most common complaint is "${TAG_LABEL[topNegative.tag].toLowerCase()}".`
    : base;
}

function OverviewBody({ data }: { data: Overview }) {
  const range = data.range;
  const scoped = (query: ListQuery) => feedbackHref({ ...query, range: range === "all" ? undefined : range });

  if (data.total.value === 0) {
    return (
      <EmptyState
        title="No feedback in this range"
        description="Try a longer date range to see earlier feedback."
      />
    );
  }

  return (
    <>
      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 overflow-hidden rounded-lg border border-border-default bg-surface md:grid-cols-5 md:divide-x md:divide-border-default"
      >
        <KpiCard label="New feedback" hint="Not yet triaged" kpi={data.newCount} range={range} href={scoped({ status: "new" })} goodWhen="down" />
        <KpiCard label="Total feedback" kpi={data.total} range={range} href={scoped({})} />
        <KpiCard label="Positive" kpi={data.positiveShare} range={range} percent href={scoped({ sentiment: "positive" })} goodWhen="up" hint={`${data.positive} thumbs up`} />
        <KpiCard label="Negative" kpi={data.negativeShare} range={range} percent href={scoped({ sentiment: "negative" })} goodWhen="down" hint={`${data.negative} thumbs down`} />
        <KpiCard label="Unassigned and open" hint="New or in progress, no owner" kpi={data.unassignedOpen} range={range} href={scoped({ assignee: UNASSIGNED })} goodWhen="down" />
      </section>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 px-4 pb-0 pt-4">
          <h3 className="type-title text-fg-primary">Sentiment over time</h3>
          <Legend />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-3">
          <SentimentChart days={data.days} />
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <TagRanking
          title="What's working"
          description={`Tags picked on ${data.positive} positive ratings`}
          tags={data.positiveTags}
          barClass="bg-feedback-success"
          hrefFor={(tag) => scoped({ sentiment: "positive", tags: [tag.tag] })}
        />
        <TagRanking
          title="What's not working"
          description={`Tags picked on ${data.negative} negative ratings`}
          tags={data.negativeTags}
          barClass="bg-feedback-danger"
          hrefFor={(tag) => scoped({ sentiment: "negative", tags: [tag.tag] })}
        />
      </div>

      <section aria-labelledby="themes-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="themes-title" className="type-title text-fg-primary">Recurring themes</h3>
          <AiLabel />
        </div>
        <p className="type-caption -mt-2 text-fg-tertiary">
          Grouped from comments by AI. Check the linked feedback before acting on a theme.
        </p>
        {data.themes.length === 0 ? (
          <p className="type-body text-fg-secondary">No themes in this range.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} range={range} href={scoped({ theme: theme.id })} />
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-baseline justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="type-title text-fg-primary">Needs attention</h3>
              <p className="type-caption text-fg-tertiary">Newest negative feedback that is untriaged or has no owner. Any date.</p>
            </div>
            <Link
              href={feedbackHref({ sentiment: "negative", status: "new" })}
              className="type-caption-strong shrink-0 rounded-sm text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.needsAttention.length === 0 ? (
              <p className="type-body text-fg-secondary">Nothing waiting. Every negative item has an owner.</p>
            ) : (
              <ul className="flex flex-col">
                {data.needsAttention.map((row) => (
                  <li key={row.feedback.id} className="border-b border-border-default last:border-b-0">
                    <Link
                      href={`/feedback/${row.feedback.id}`}
                      className="group flex items-start gap-3 rounded-sm py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                    >
                      <SentimentIcon sentiment={row.feedback.sentiment} />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="type-body line-clamp-2 text-fg-primary group-hover:text-action-primary">
                          {row.feedback.comment}
                        </span>
                        <span className="type-caption text-fg-tertiary">
                          {row.author.name} · {ROLE_LABEL[row.author.role]} · {formatDateTime(row.feedback.createdAt)}
                        </span>
                        <TagList tags={row.feedback.tags} max={2} />
                      </span>
                      <StatusBadge status={row.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="type-title text-fg-primary">By user role</h3>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.roles.map((entry) => (
              <Link
                key={entry.role}
                href={scoped({ role: entry.role })}
                className="group inline-flex min-w-0 items-stretch overflow-hidden rounded-lg border border-border-default bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus hover:border-border-strong"
                aria-label={`${ROLE_LABEL[entry.role]}: ${entry.positive} positive, ${entry.negative} negative`}
              >
                <span className="type-caption-strong flex items-center whitespace-nowrap bg-surface-muted px-2 text-fg-primary group-hover:bg-surface-subtle group-hover:text-action-primary">
                  {ROLE_LABEL[entry.role]}
                </span>
                <span className="flex items-center gap-1 px-1.5 py-1">
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-feedback-success-subtle px-1.5 py-0.5 type-caption-strong tabular-nums text-feedback-success">
                    <ThumbsUp className="size-3" aria-hidden />
                    {entry.positive}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 type-caption-strong tabular-nums text-red-600">
                    <ThumbsDown className="size-3" aria-hidden />
                    {entry.negative}
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  hint,
  kpi,
  range,
  href,
  percent = false,
  goodWhen,
}: {
  label: string;
  hint?: string;
  kpi: Kpi;
  range: DateRange;
  href: string;
  percent?: boolean;
  goodWhen?: "up" | "down";
}) {
  const value = percent ? formatPercent(kpi.value) : String(kpi.value);
  const delta = kpi.previous === null ? null : kpi.value - kpi.previous;
  const deltaText =
    delta === null
      ? null
      : percent
        ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)} pts`
        : `${delta >= 0 ? "+" : ""}${delta}`;
  const good = delta === null || delta === 0 || !goodWhen ? null : goodWhen === "up" ? delta > 0 : delta < 0;
  const DeltaIcon = delta !== null && delta < 0 ? TrendingDown : TrendingUp;

  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
    >
      <span className="type-caption-strong truncate text-fg-tertiary">{label}</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="type-heading text-fg-primary">{value}</span>
        {deltaText ? (
          <span
            title={`${deltaText} vs ${PERIOD[range]}`}
            className={cn(
              "type-caption inline-flex items-center gap-1",
              good === null ? "text-fg-secondary" : good ? "text-feedback-success" : "text-feedback-danger",
            )}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {deltaText}
            <span className="sr-only"> vs {PERIOD[range]}</span>
          </span>
        ) : null}
      </span>
      {hint ? <span className="type-caption truncate text-fg-tertiary">{hint}</span> : null}
    </Link>
  );
}

function Legend() {
  return (
    <span className="flex items-center gap-4">
      <span className="type-caption inline-flex items-center gap-1.5 text-fg-secondary">
        <span className="h-2.5 w-3 shrink-0 rounded-sm bg-feedback-success-strong" aria-hidden />
        Positive
      </span>
      <span className="type-caption inline-flex items-center gap-1.5 text-fg-secondary">
        <span className="h-2.5 w-3 shrink-0 rounded-sm bg-red-400" aria-hidden />
        Negative
      </span>
    </span>
  );
}

const SENTIMENT_PLOT_HEIGHT_PX = 112;
const SENTIMENT_COUNT_BAND_PX = 18;

function SentimentChart({ days }: { days: Overview["days"] }) {
  const max = Math.max(...days.map((day) => day.positive + day.negative), 1);
  const labelEvery = days.length > 14 ? Math.ceil(days.length / 10) : 1;
  const columnClass = "flex min-w-7 flex-1 flex-col items-center";

  return (
    <div className="rounded-lg border border-border-default bg-surface-muted/50 px-2 pt-3 sm:px-3">
      <div className="relative h-28">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
          <div className="border-t border-dashed border-border-default/50" />
          <div className="border-t border-dashed border-border-default/50" />
          <div className="border-t border-border-default" />
        </div>
        <ol className="relative flex h-full items-stretch gap-1 overflow-x-auto sm:gap-1.5">
          {days.map((day) => {
            const total = day.positive + day.negative;
            const barHeightPx = total
              ? Math.max(
                  (total / max) * (SENTIMENT_PLOT_HEIGHT_PX - SENTIMENT_COUNT_BAND_PX),
                  10,
                )
              : 0;
            return (
              <li
                key={day.date}
                className={cn(columnClass, "justify-end")}
                aria-label={`${formatShortDay(day.date)}: ${day.positive} positive, ${day.negative} negative`}
              >
                <span
                  className={cn(
                    "type-caption mb-1 tabular-nums leading-none",
                    total ? "font-medium text-fg-secondary" : "text-fg-disabled",
                  )}
                >
                  {total || "—"}
                </span>
                {total === 0 ? (
                  <div className="h-0.5 w-full max-w-8 rounded-full bg-border-strong/40" aria-hidden />
                ) : (
                  <div
                    className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md ring-1 ring-border-default/40"
                    style={{ height: barHeightPx }}
                  >
                    {day.negative > 0 ? (
                      <div className="min-h-px bg-red-400" style={{ flex: day.negative }} />
                    ) : null}
                    {day.positive > 0 ? (
                      <div className="min-h-px bg-feedback-success-strong" style={{ flex: day.positive }} />
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2 pt-1.5 sm:gap-1.5" aria-hidden>
        {days.map((day, index) => (
          <div key={`${day.date}-label`} className={cn(columnClass, "type-caption whitespace-nowrap text-fg-tertiary")}>
            {index % labelEvery === 0 ? formatShortDay(day.date) : "\u00a0"}
          </div>
        ))}
      </div>
    </div>
  );
}

function TagRanking({
  title,
  description,
  tags,
  barClass,
  hrefFor,
}: {
  title: string;
  description: string;
  tags: TagCount[];
  barClass: string;
  hrefFor: (tag: TagCount) => string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <h3 className="type-title text-fg-primary">{title}</h3>
        <p className="type-caption text-fg-tertiary">{description}</p>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="type-body text-fg-secondary">No tags in this range.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {tags.map((entry, index) => (
              <li key={entry.tag}>
                <Link
                  href={hrefFor(entry)}
                  className="group flex flex-col gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="type-body-strong text-fg-primary group-hover:text-action-primary">
                      {index + 1}. {TAG_LABEL[entry.tag]}
                    </span>
                    <span className="type-caption text-fg-secondary">
                      {entry.count} · {formatPercent(entry.share)}
                    </span>
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <span className={cn("block h-full rounded-full", barClass)} style={{ width: `${Math.round(entry.share * 100)}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function AiLabel() {
  return (
    <span className="type-caption-strong inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-fg-brand">
      <Sparkles className="size-3" aria-hidden />
      AI-generated
    </span>
  );
}

function ThemeCard({ theme, range, href }: { theme: ThemeSummary; range: DateRange; href: string }) {
  const delta = theme.count - theme.previousCount;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-stretch gap-2">
          <SentimentIcon
            sentiment={theme.sentiment}
            className="size-auto h-full min-h-11 w-11 shrink-0 rounded-lg"
            iconClassName="size-5"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="type-body-strong text-fg-primary">{theme.label}</h3>
            <p className="type-caption text-fg-secondary">
              {theme.count} feedback
              {range !== "all" ? ` · ${delta >= 0 ? "+" : ""}${delta} vs ${PERIOD[range]}` : ""}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="type-body-lg type-body-strong text-fg-primary">{theme.summary}</p>
        <ul className="flex flex-col gap-2">
          {theme.quotes.map((quote) => (
            <li key={quote.feedbackId}>
              <Link
                href={`/feedback/${quote.feedbackId}`}
                className="block rounded-sm border-l-2 border-border-strong pl-3 hover:border-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <span className="type-body line-clamp-2 text-fg-primary">&ldquo;{quote.text}&rdquo;</span>
                <span className="type-caption text-fg-tertiary">{quote.author}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-1 rounded-md bg-surface-subtle p-3">
          <span className="type-caption-strong inline-flex items-center gap-1 text-fg-tertiary">
            <Sparkles className="size-3" aria-hidden /> Suggested action
          </span>
          <span className="type-body text-fg-primary">{theme.recommendedAction}</span>
        </div>
        <Link
          href={href}
          className="type-body-strong inline-flex items-center gap-1 self-start rounded-sm text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          View {theme.count} feedback <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

export function OverviewFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
