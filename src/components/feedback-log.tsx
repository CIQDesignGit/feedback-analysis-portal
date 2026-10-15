"use client";

import {
  Button,
  Checkbox,
  DropdownMultiSelect,
  EmptyState,
  Input,
  PaginationV2,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  enqueueToast,
} from "@ciq-dev/ciq-design-system";
import { ArrowDown, ArrowUp, MessagesSquare, Quote, Search, Tags, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadError } from "@/components/load-error";
import { SentimentIcon } from "@/components/sentiment-badge";
import { StatusBadge } from "@/components/status-badge";
import { TagList } from "@/components/tag-chip";
import {
  ASSIGNEES,
  THEME_OPTIONS,
  UNASSIGNED,
  bulkUpdate,
  conversationTitle,
  listFeedback,
} from "@/lib/api";
import {
  ALL_TAGS,
  RANGES,
  RANGE_LABEL,
  ROLES,
  ROLE_LABEL,
  SENTIMENT_LABEL,
  STATUSES,
  STATUS_LABEL,
  TAG_LABEL,
  formatDateTime,
} from "@/lib/format";
import { FILTER_KEYS, feedbackHref, parseListQuery } from "@/lib/list-query";
import type { FeedbackPatch, ListQuery, Status } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { cn } from "@/lib/utils";

const ANY = "any";

export function FeedbackLog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseListQuery(searchParams);
  const searchKey = searchParams.toString();
  const [version, setVersion] = useState(0);
  const load = useCallback(() => listFeedback(parseListQuery(new URLSearchParams(searchKey))), [searchKey]);
  const { phase, data } = useQuery(`${searchKey}#${version}`, load);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionKey, setSelectionKey] = useState(searchKey);
  const [busy, setBusy] = useState(false);

  if (selectionKey !== searchKey) {
    setSelectionKey(searchKey);
    setSelected([]);
  }

  function navigate(next: ListQuery) {
    router.replace(feedbackHref(next), { scroll: false });
  }

  function update(patch: Partial<ListQuery>) {
    navigate({ ...query, page: undefined, ...patch });
  }

  const rows = data?.rows ?? [];
  const pageIds = rows.map((row) => row.feedback.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someSelected = selected.length > 0 && !allSelected;
  const filterCount = FILTER_KEYS.filter((key) => {
    const value = query[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const listParams = new URLSearchParams(searchKey);
  listParams.delete("page");
  const detailSuffix = listParams.toString() ? `?${listParams.toString()}` : "";

  async function applyBulk(patch: FeedbackPatch, description: string) {
    setBusy(true);
    try {
      await bulkUpdate(selected, patch);
      enqueueToast({ title: `Updated ${selected.length} feedback`, description, variant: "success" });
      setSelected([]);
      setVersion((value) => value + 1);
    } catch {
      enqueueToast({ title: "Couldn't update the selected feedback", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="type-heading text-fg-primary">Feedback log</h2>
        <p className="type-body text-fg-secondary">
          Every rating and comment left on Ask Ally answers. Open a row to see it in its conversation.
        </p>
      </header>

      <Toolbar query={query} onChange={update} />

      {filterCount > 0 ? (
        <ActiveFilters query={query} onChange={update} onClear={() => navigate({ sort: query.sort })} />
      ) : null}

      {phase === "loading" ? <LogSkeleton /> : null}
      {phase === "error" ? <LoadError message="Couldn't load feedback." /> : null}

      {phase === "ready" && data && data.total === 0 ? (
        <EmptyState
          title={filterCount > 0 ? "No feedback matches these filters" : "No feedback yet"}
          description={
            filterCount > 0
              ? "Try removing a filter or searching for a different word."
              : "Feedback will appear here when people rate Ask Ally answers."
          }
        >
          {filterCount > 0 ? (
            <Button variant="outline" onClick={() => navigate({ sort: query.sort })}>
              Clear all filters
            </Button>
          ) : null}
        </EmptyState>
      ) : null}

      {phase === "ready" && data && data.total > 0 ? (
        <>
          <p className="type-caption text-fg-secondary" aria-live="polite">
            Showing {(data.page - 1) * data.pageSize + 1}–{(data.page - 1) * data.pageSize + rows.length} of{" "}
            {data.total} feedback
          </p>
          <div className="overflow-x-auto rounded-md border border-border-default bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="table-cell w-10 bg-surface align-middle">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={() =>
                        setSelected(allSelected ? selected.filter((id) => !pageIds.includes(id)) : [...new Set([...selected, ...pageIds])])
                      }
                    />
                  </TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">
                    <button
                      type="button"
                      onClick={() => update({ sort: query.sort === "oldest" ? undefined : "oldest" })}
                      className="inline-flex items-center gap-1 rounded-sm hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      aria-label={`Submitted, sorted ${query.sort === "oldest" ? "oldest" : "newest"} first. Click to reverse.`}
                    >
                      Submitted
                      {query.sort === "oldest" ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />}
                    </button>
                  </TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Feedback</TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Tags</TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Given by</TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Conversation</TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Status</TableHead>
                  <TableHead className="table-cell bg-surface text-fg-secondary">Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const id = row.feedback.id;
                  const isSelected = selected.includes(id);
                  const isNew = row.status === "new";
                  return (
                    <TableRow key={id} className={cn("relative align-top", isSelected && "bg-brand-50/60")}>
                      <TableCell className="relative z-10">
                        <Checkbox
                          aria-label={`Select feedback from ${row.author.name}`}
                          checked={isSelected}
                          onCheckedChange={() =>
                            setSelected(isSelected ? selected.filter((item) => item !== id) : [...selected, id])
                          }
                        />
                      </TableCell>
                      <TableCell className="type-caption whitespace-nowrap text-fg-secondary">
                        <span className="flex items-center gap-2">
                          {isNew ? <span className="size-2 rounded-full bg-brand" aria-label="New" /> : <span className="size-2" aria-hidden />}
                          {formatDateTime(row.feedback.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-72 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <SentimentIcon sentiment={row.feedback.sentiment} />
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link
                              href={`/feedback/${id}${detailSuffix}`}
                              className={cn(
                                "type-body line-clamp-2 text-fg-primary after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                                isNew && "font-semibold",
                              )}
                            >
                              {row.feedback.comment || "No written comment"}
                            </Link>
                            <span className="type-caption flex items-start gap-1 text-fg-tertiary">
                              <Quote className="mt-0.5 size-3 shrink-0" aria-hidden />
                              <span className="line-clamp-1">
                                {row.feedback.selection ? row.feedback.selection.quote : "On the whole answer"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <TagList tags={row.feedback.tags} max={2} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex flex-col">
                          <span className="type-body text-fg-primary">{row.author.name}</span>
                          <span className="type-caption text-fg-tertiary">{ROLE_LABEL[row.author.role]}</span>
                        </span>
                      </TableCell>
                      <TableCell className="min-w-48 max-w-64">
                        <span className="flex flex-col items-start gap-1">
                          <span className="type-body line-clamp-1 text-fg-secondary">{row.conversation.title}</span>
                          {row.conversationFeedbackCount > 1 && query.conversation !== row.conversation.id ? (
                            <button
                              type="button"
                              onClick={() => update({ conversation: row.conversation.id })}
                              className="type-caption relative z-10 inline-flex items-center gap-1 rounded-full border border-border-default px-2 py-0.5 text-fg-secondary hover:border-border-strong hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                              title="Show all feedback on this conversation"
                            >
                              <MessagesSquare className="size-3" aria-hidden />
                              {row.conversationFeedbackCount} feedback
                            </button>
                          ) : (
                            <span className="type-caption text-fg-tertiary">{row.conversation.retailer}</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="type-body whitespace-nowrap text-fg-secondary">
                        {row.assignee ?? <span className="text-fg-tertiary">Unassigned</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationV2
            pagination={{ page: data.page - 1, pageSize: data.pageSize }}
            totalRows={data.total}
            onPaginationChange={(next) =>
              navigate({ ...query, page: next.page && next.page > 0 ? next.page + 1 : undefined })
            }
          />
        </>
      ) : null}

      {selected.length > 0 ? (
        <BulkBar
          count={selected.length}
          busy={busy}
          onAssign={(assignee) =>
            applyBulk({ assignee }, assignee ? `Assigned to ${assignee}.` : "Removed the assignee.")
          }
          onStatus={(status) => applyBulk({ status }, `Status set to ${STATUS_LABEL[status]}.`)}
          onClear={() => setSelected([])}
        />
      ) : null}
    </div>
  );
}

function Toolbar({ query, onChange }: { query: ListQuery; onChange: (patch: Partial<ListQuery>) => void }) {
  const [text, setText] = useState(query.q ?? "");
  const [syncedQ, setSyncedQ] = useState(query.q ?? "");
  const onChangeRef = useRef(onChange);

  if ((query.q ?? "") !== syncedQ) {
    setSyncedQ(query.q ?? "");
    setText(query.q ?? "");
  }

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (text === syncedQ) return;
    const timer = setTimeout(() => onChangeRef.current({ q: text.trim() ? text : undefined }), 300);
    return () => clearTimeout(timer);
  }, [text, syncedQ]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-tertiary" aria-hidden />
          <Input
            aria-label="Search feedback"
            value={text}
            placeholder="Search comments, highlighted text, or people"
            onChange={(event) => setText(event.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={query.sentiment ?? ANY}
          onValueChange={(value) => onChange({ sentiment: value === ANY ? undefined : (value as ListQuery["sentiment"]) })}
        >
          <TabsList aria-label="Sentiment">
            <TabsTrigger value={ANY}>All</TabsTrigger>
            <TabsTrigger value="positive">{SENTIMENT_LABEL.positive}</TabsTrigger>
            <TabsTrigger value="negative">{SENTIMENT_LABEL.negative}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMultiSelect
          options={ALL_TAGS.map((tag) => ({ value: tag, label: TAG_LABEL[tag] }))}
          selected={query.tags ?? []}
          onChange={(tags) => onChange({ tags: tags as ListQuery["tags"] })}
          placeholder="Tags"
          searchPlaceholder="Search tags"
          icon={<Tags className="size-4" aria-hidden />}
          triggerClassName="h-9"
        />
        <FilterSelect
          label="Status"
          value={query.status}
          options={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
          onChange={(value) => onChange({ status: value as Status | undefined })}
        />
        <FilterSelect
          label="Assignee"
          value={query.assignee}
          options={[{ value: UNASSIGNED, label: "Unassigned" }, ...ASSIGNEES.map((name) => ({ value: name, label: name }))]}
          onChange={(value) => onChange({ assignee: value })}
        />
        <FilterSelect
          label="Role"
          value={query.role}
          options={ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }))}
          onChange={(value) => onChange({ role: value as ListQuery["role"] })}
        />
        <FilterSelect
          label="Theme"
          value={query.theme}
          options={THEME_OPTIONS.map((theme) => ({ value: theme.id, label: theme.label }))}
          onChange={(value) => onChange({ theme: value })}
          wide
        />
        <FilterSelect
          label="Date"
          anyLabel="All time"
          value={query.range}
          options={RANGES.filter((value) => value !== "all").map((value) => ({ value, label: RANGE_LABEL[value] }))}
          onChange={(value) => onChange({ range: value as ListQuery["range"] })}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  anyLabel,
  wide = false,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
  anyLabel?: string;
  wide?: boolean;
}) {
  return (
    <Select value={value ?? ANY} onValueChange={(next) => onChange(next === ANY ? undefined : next)}>
      <SelectTrigger aria-label={label} className={cn("h-9", wide ? "w-56" : "w-40", value && "border-border-focus")}>
        <span className="type-caption text-fg-tertiary">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel ?? "Any"}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActiveFilters({
  query,
  onChange,
  onClear,
}: {
  query: ListQuery;
  onChange: (patch: Partial<ListQuery>) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (query.q) chips.push({ key: "q", label: `Search: "${query.q}"`, remove: () => onChange({ q: undefined }) });
  if (query.sentiment) chips.push({ key: "sentiment", label: SENTIMENT_LABEL[query.sentiment], remove: () => onChange({ sentiment: undefined }) });
  for (const tag of query.tags ?? []) {
    chips.push({ key: `tag-${tag}`, label: `Tag: ${TAG_LABEL[tag]}`, remove: () => onChange({ tags: query.tags?.filter((item) => item !== tag) }) });
  }
  if (query.status) chips.push({ key: "status", label: `Status: ${STATUS_LABEL[query.status]}`, remove: () => onChange({ status: undefined }) });
  if (query.assignee) {
    chips.push({
      key: "assignee",
      label: `Assignee: ${query.assignee === UNASSIGNED ? "Unassigned" : query.assignee}`,
      remove: () => onChange({ assignee: undefined }),
    });
  }
  if (query.role) chips.push({ key: "role", label: `Role: ${ROLE_LABEL[query.role]}`, remove: () => onChange({ role: undefined }) });
  if (query.theme) {
    const theme = THEME_OPTIONS.find((item) => item.id === query.theme);
    chips.push({ key: "theme", label: `Theme: ${theme?.label ?? query.theme}`, remove: () => onChange({ theme: undefined }) });
  }
  if (query.conversation) {
    chips.push({
      key: "conversation",
      label: `Conversation: ${conversationTitle(query.conversation)}`,
      remove: () => onChange({ conversation: undefined }),
    });
  }
  if (query.range) chips.push({ key: "range", label: RANGE_LABEL[query.range], remove: () => onChange({ range: undefined }) });

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="type-caption inline-flex max-w-80 items-center gap-1 rounded-full border border-border-default bg-surface py-1 pr-1 pl-3 text-fg-primary"
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`Remove ${chip.label}`}
            className="rounded-full p-0.5 text-fg-tertiary hover:bg-surface-muted hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}

function BulkBar({
  count,
  busy,
  onAssign,
  onStatus,
  onClear,
}: {
  count: number;
  busy: boolean;
  onAssign: (assignee: string | null) => void;
  onStatus: (status: Status) => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-1 mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border-strong bg-surface p-3 shadow-lg">
      <span className="type-body-strong text-fg-primary">{count} selected</span>
      <Select value="" onValueChange={(value) => onAssign(value === UNASSIGNED ? null : value)} disabled={busy}>
        <SelectTrigger aria-label="Assign selected" className="h-9 w-44">
          <SelectValue placeholder="Assign to…" />
        </SelectTrigger>
        <SelectContent>
          {ASSIGNEES.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
          <SelectItem value={UNASSIGNED}>Remove assignee</SelectItem>
        </SelectContent>
      </Select>
      <Select value="" onValueChange={(value) => onStatus(value as Status)} disabled={busy}>
        <SelectTrigger aria-label="Set status of selected" className="h-9 w-44">
          <SelectValue placeholder="Set status…" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" onClick={onClear} disabled={busy} className="ml-auto">
        Clear selection
      </Button>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function FeedbackLogFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-24 w-full" />
      <LogSkeleton />
    </div>
  );
}
