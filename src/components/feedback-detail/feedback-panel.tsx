"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardHeader,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ciq-dev/ciq-design-system";
import {
  CircleCheck,
  CircleDot,
  MessageSquareText,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SentimentIcon } from "@/components/sentiment-badge";
import { StatusBadge } from "@/components/status-badge";
import { TagList } from "@/components/tag-chip";
import { ASSIGNEES, UNASSIGNED } from "@/lib/api";
import {
  ROLE_LABEL,
  STATUSES,
  STATUS_LABEL,
  formatDateTime,
  initials,
} from "@/lib/format";
import { feedbackHref } from "@/lib/list-query";
import type {
  ActionState,
  ActivityEvent,
  FeedbackDetail,
  FeedbackPatch,
  Status,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function FeedbackCard({ item }: { item: FeedbackDetail }) {
  const { feedback, author } = item;
  const positive = feedback.sentiment === "positive";
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="type-caption-strong bg-brand-50 text-fg-brand">
              {initials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="type-body-strong text-fg-primary">{author.name}</span>
            <span className="type-caption text-fg-tertiary">
              {ROLE_LABEL[author.role]} · {author.account}
            </span>
          </div>
          <SentimentIcon sentiment={feedback.sentiment} className="size-9" />
        </div>
        <p className="type-caption -mt-2 text-fg-tertiary">Submitted {formatDateTime(feedback.createdAt)}</p>

        <Section label={feedback.selection ? "Highlighted text" : "Feedback on"}>
          {feedback.selection ? (
            <blockquote className="type-body rounded-md border-l-4 border-brand bg-brand-50/60 px-3 py-2 text-fg-primary">
              {feedback.selection.quote}
            </blockquote>
          ) : (
            <p className="type-body text-fg-secondary">The whole answer (no text highlighted)</p>
          )}
        </Section>

        <Section label={positive ? "What worked" : "What didn't work"}>
          {feedback.tags.length ? <TagList tags={feedback.tags} /> : <p className="type-body text-fg-tertiary">No tags picked</p>}
        </Section>

        <Section label="Comment">
          <p className="type-body text-fg-primary">
            {feedback.comment.trim() || <span className="text-fg-tertiary">No written comment</span>}
          </p>
        </Section>

        {item.themes.length > 0 ? (
          <Section label="Part of theme">
            <ul className="flex flex-wrap gap-1.5">
              {item.themes.map((theme) => (
                <li key={theme.id}>
                  <Link
                    href={feedbackHref({ theme: theme.id })}
                    className="type-caption inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-fg-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                  >
                    <Sparkles className="size-3" aria-hidden />
                    {theme.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SiblingList({ item, hrefFor }: { item: FeedbackDetail; hrefFor: (id: string) => string }) {
  if (item.siblings.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="type-body-strong text-fg-primary">
          Other feedback on this conversation ({item.siblings.length})
        </h3>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {item.siblings.map((row) => (
            <li key={row.feedback.id} className="border-b border-border-default last:border-b-0">
              <Link
                href={hrefFor(row.feedback.id)}
                className="group flex items-start gap-2.5 rounded-sm py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <SentimentIcon sentiment={row.feedback.sentiment} className="size-6" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body line-clamp-2 text-fg-primary group-hover:text-action-primary">
                    {row.feedback.comment || "No written comment"}
                  </span>
                  <span className="type-caption text-fg-tertiary">
                    {row.author.name} · {row.feedback.selection ? "highlight" : "whole answer"}
                  </span>
                </span>
                <StatusBadge status={row.status} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ActionsCard({
  item,
  saving,
  onAction,
}: {
  item: FeedbackDetail;
  saving: boolean;
  onAction: (actionId: string, state: ActionState) => void;
}) {
  if (item.actions.length === 0) return null;
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="type-body-strong text-fg-primary">Recommended actions</h3>
          <span className="type-caption-strong inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-fg-brand">
            <Sparkles className="size-3" aria-hidden />
            AI-suggested
          </span>
        </div>
        <p className="type-caption text-fg-tertiary">Based on the tags and comment. Accepting one moves new feedback to In progress.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {item.actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              action.state === "accepted"
                ? "border-feedback-success-border bg-feedback-success-subtle"
                : action.state === "dismissed"
                  ? "border-border-default bg-surface-subtle"
                  : "border-border-default bg-surface",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("type-body-strong", action.state === "dismissed" ? "text-fg-tertiary line-through" : "text-fg-primary")}>
                {action.label}
              </span>
              {action.state === "accepted" ? (
                <span className="type-caption-strong inline-flex shrink-0 items-center gap-1 text-feedback-success">
                  <CircleCheck className="size-3.5" aria-hidden /> Accepted
                </span>
              ) : action.state === "dismissed" ? (
                <span className="type-caption shrink-0 text-fg-tertiary">Dismissed</span>
              ) : null}
            </div>
            <p className="type-caption text-fg-secondary">{action.rationale}</p>
            <p className="type-caption text-fg-tertiary">Suggested owner: {action.suggestedOwner}</p>
            <div className="flex gap-2">
              {action.state === "suggested" ? (
                <>
                  <Button size="sm" disabled={saving} onClick={() => onAction(action.id, "accepted")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => onAction(action.id, "dismissed")}>
                    Dismiss
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" disabled={saving} onClick={() => onAction(action.id, "suggested")}>
                  Undo
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TrackingCard({
  item,
  saving,
  onSave,
}: {
  item: FeedbackDetail;
  saving: boolean;
  onSave: (patch: FeedbackPatch) => Promise<boolean>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="type-body-strong text-fg-primary">Tracking</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="tracking-status">Status</Label>
            <Select value={item.status} disabled={saving} onValueChange={(value) => onSave({ status: value as Status })}>
              <SelectTrigger id="tracking-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tracking-assignee">Assignee</Label>
            <Select
              value={item.assignee ?? UNASSIGNED}
              disabled={saving}
              onValueChange={(value) => onSave({ assignee: value === UNASSIGNED ? null : value })}
            >
              <SelectTrigger id="tracking-assignee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {ASSIGNEES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {item.status !== "resolved" ? (
          <Button variant="outline" disabled={saving} onClick={() => onSave({ status: "resolved" })}>
            Mark resolved
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

const ACTIVITY_ICON: Record<ActivityEvent["type"], typeof CircleDot> = {
  created: MessageSquareText,
  status: CircleDot,
  assignee: UserRound,
  note: MessageSquareText,
  action: Zap,
};

export function ActivityCard({
  item,
  saving,
  onSave,
}: {
  item: FeedbackDetail;
  saving: boolean;
  onSave: (patch: FeedbackPatch) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");

  async function addNote() {
    if (!draft.trim()) return;
    if (await onSave({ note: draft })) setDraft("");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="type-body-strong text-fg-primary">Activity</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="activity-note" className="sr-only">
            Add a note
          </Label>
          <Textarea
            id="activity-note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) addNote();
            }}
            placeholder="Add a note for the team"
            rows={2}
            disabled={saving}
          />
          <Button variant="outline" size="sm" className="self-end" disabled={saving || !draft.trim()} onClick={addNote}>
            Add note
          </Button>
        </div>
        <ol className="flex flex-col">
          {item.activity.map((event, index) => {
            const Icon = ACTIVITY_ICON[event.type];
            return (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {index < item.activity.length - 1 ? (
                  <span className="absolute top-6 bottom-0 left-3 w-px bg-border-default" aria-hidden />
                ) : null}
                <span className="z-10 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface text-fg-tertiary">
                  <Icon className="size-3" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn("type-body", event.type === "note" ? "whitespace-pre-wrap rounded-md bg-surface-subtle px-2 py-1 text-fg-primary" : "text-fg-primary")}>
                    {event.detail}
                  </span>
                  <span className="type-caption text-fg-tertiary">
                    {event.actor} · {formatDateTime(event.at)}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="type-caption-strong text-fg-tertiary">{label}</span>
      {children}
    </div>
  );
}
