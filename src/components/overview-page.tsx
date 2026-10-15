"use client";

import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ciq-dev/ciq-design-system";
import { ArrowRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
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
        <Tabs value={range} onValueChange={setRange}>
          <TabsList aria-label="Date range">
            {RANGES.map((value) => (
              <TabsTrigger key={value} value={value}>
                {RANGE_LABEL[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
        <KpiCard label="New" hint="Not yet triaged" kpi={data.newCount} range={range} href={scoped({ status: "new" })} goodWhen="down" />
        <KpiCard label="Total feedback" kpi={data.total} range={range} href={scoped({})} />
        <KpiCard label="Positive" kpi={data.positiveShare} range={range} percent href={scoped({ sentiment: "positive" })} goodWhen="up" hint={`${data.positive} thumbs up`} />
        <KpiCard label="Negative" kpi={data.negativeShare} range={range} percent href={scoped({ sentiment: "negative" })} goodWhen="down" hint={`${data.negative} thumbs down`} />
        <KpiCard label="Unassigned and open" hint="New or in progress, no owner" kpi={data.unassignedOpen} range={range} href={scoped({ assignee: UNASSIGNED })} goodWhen="down" />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between gap-4 pb-2">
          <h3 className="type-title text-fg-primary">Sentiment over time</h3>
          <Legend />
        </CardHeader>
        <CardContent>
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
          <CardContent className="flex flex-col gap-4">
            {data.roles.map((entry) => {
              const total = entry.positive + entry.negative;
              return (
                <Link
                  key={entry.role}
                  href={scoped({ role: entry.role })}
                  className="group flex flex-col gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="type-body-strong text-fg-primary group-hover:text-action-primary">
                      {ROLE_LABEL[entry.role]}
                    </span>
                    <span className="type-caption text-fg-secondary">
                      {entry.positive} positive · {entry.negative} negative
                    </span>
                  </span>
                  <span
                    className="flex h-2 overflow-hidden rounded-full bg-surface-muted"
                    role="img"
                    aria-label={`${ROLE_LABEL[entry.role]}: ${entry.positive} positive, ${entry.negative} negative`}
                  >
                    <span className="bg-feedback-success" style={{ width: `${(entry.positive / total) * 100}%` }} />
                    <span className="bg-feedback-danger" style={{ width: `${(entry.negative / total) * 100}%` }} />
                  </span>
                </Link>
              );
            })}
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
        <span className="size-2 rounded-full bg-feedback-success" aria-hidden /> Positive
      </span>
      <span className="type-caption inline-flex items-center gap-1.5 text-fg-secondary">
        <span className="size-2 rounded-full bg-feedback-danger" aria-hidden /> Negative
      </span>
    </span>
  );
}

function SentimentChart({ days }: { days: Overview["days"] }) {
  const max = Math.max(...days.map((day) => day.positive + day.negative), 1);
  const labelEvery = days.length > 14 ? Math.ceil(days.length / 10) : 1;
  return (
    <ol className="flex h-40 items-end gap-1.5 overflow-x-auto pt-4">
      {days.map((day, index) => {
        const total = day.positive + day.negative;
        return (
          <li
            key={day.date}
            className="flex h-full min-w-6 flex-1 flex-col items-center justify-end gap-1.5"
            aria-label={`${formatShortDay(day.date)}: ${day.positive} positive, ${day.negative} negative`}
          >
            <span className="type-caption text-fg-tertiary">{total || ""}</span>
            <span className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${(total / max) * 100}%` }}>
              <span className="bg-feedback-danger" style={{ flexGrow: day.negative }} />
              <span className="bg-feedback-success" style={{ flexGrow: day.positive }} />
            </span>
            <span className="type-caption whitespace-nowrap text-fg-tertiary">
              {index % labelEvery === 0 ? formatShortDay(day.date) : "\u00a0"}
            </span>
          </li>
        );
      })}
    </ol>
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
          <ol className="flex flex-col">
            {tags.map((entry, index) => (
              <li key={entry.tag} className="border-b border-border-default py-2.5 last:border-b-0">
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
      <CardHeader className="flex flex-col gap-2 pb-3">
        <div className="flex items-start gap-2">
          <SentimentIcon sentiment={theme.sentiment} className="mt-0.5" />
          <h3 className="type-body-strong flex-1 text-fg-primary">{theme.label}</h3>
        </div>
        <p className="type-caption text-fg-secondary">
          {theme.count} feedback
          {range !== "all" ? ` · ${delta >= 0 ? "+" : ""}${delta} vs ${PERIOD[range]}` : ""}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="type-body text-fg-secondary">{theme.summary}</p>
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
