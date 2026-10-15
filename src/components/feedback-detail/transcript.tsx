"use client";

import { Card, CardContent, CardHeader } from "@ciq-dev/ciq-design-system";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { ROLE_LABEL, formatDateTime } from "@/lib/format";
import type { Conversation, FeedbackRow, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Anchor = {
  row: FeedbackRow;
  number: number;
  current: boolean;
};

export function Transcript({
  conversation,
  user,
  current,
  siblings,
  hrefFor,
}: {
  conversation: Conversation;
  user: User;
  current: FeedbackRow;
  siblings: FeedbackRow[];
  hrefFor: (id: string) => string;
}) {
  const messageOrder = new Map(conversation.messages.map((message, index) => [message.id, index]));
  const anchors: Anchor[] = [current, ...siblings]
    .sort(
      (a, b) =>
        (messageOrder.get(a.feedback.messageId) ?? 0) - (messageOrder.get(b.feedback.messageId) ?? 0) ||
        (a.feedback.selection?.start ?? -1) - (b.feedback.selection?.start ?? -1) ||
        a.feedback.createdAt.localeCompare(b.feedback.createdAt),
    )
    .map((row, index) => ({ row, number: index + 1, current: row.feedback.id === current.feedback.id }));

  const currentId = current.feedback.id;
  useEffect(() => {
    document.getElementById("current-anchor")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentId]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 border-b border-border-default pb-4">
        <h3 className="type-title text-fg-primary">{conversation.title}</h3>
        <p className="type-caption text-fg-tertiary">
          {user.name} · {ROLE_LABEL[user.role]}, {user.account} · {conversation.retailer} · Started{" "}
          {formatDateTime(conversation.startedAt)}
        </p>
        <p className="type-caption text-fg-tertiary">
          {conversation.messages.length} messages · {anchors.length} feedback on this conversation
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        {conversation.messages.map((message) => {
          const onMessage = anchors.filter((anchor) => anchor.row.feedback.messageId === message.id);
          const wholeCurrent = onMessage.some((anchor) => anchor.current && !anchor.row.feedback.selection);
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
              <span className="type-caption text-fg-tertiary">
                {isUser ? user.name : "Ally"} · {formatDateTime(message.timestamp)}
              </span>
              <div
                id={wholeCurrent ? "current-anchor" : undefined}
                className={cn(
                  "type-body max-w-[90%] whitespace-pre-wrap break-words rounded-2xl p-3 text-fg-primary md:p-4",
                  isUser ? "rounded-br-[2px] bg-brand-50" : "rounded-bl-[2px] bg-surface-muted",
                  wholeCurrent && "ring-2 ring-brand ring-offset-2 ring-offset-surface",
                )}
              >
                {isUser ? message.content : highlight(message.content, onMessage, hrefFor)}
              </div>
              {onMessage.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5" aria-label="Feedback on this answer">
                  {onMessage.map((anchor) => (
                    <li key={anchor.row.feedback.id}>
                      <AnchorChip anchor={anchor} href={hrefFor(anchor.row.feedback.id)} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function highlight(content: string, anchors: Anchor[], hrefFor: (id: string) => string): ReactNode {
  const spans = anchors
    .filter((anchor) => anchor.row.feedback.selection)
    .sort((a, b) => a.row.feedback.selection!.start - b.row.feedback.selection!.start || Number(b.current) - Number(a.current));

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const anchor of spans) {
    const { start, end } = anchor.row.feedback.selection!;
    if (start < cursor) continue;
    if (start > cursor) parts.push(content.slice(cursor, start));
    const text = content.slice(start, end);
    const tone =
      anchor.row.feedback.sentiment === "positive"
        ? "bg-feedback-success-subtle decoration-feedback-success"
        : "bg-feedback-danger/10 decoration-feedback-danger";
    parts.push(
      anchor.current ? (
        <mark
          key={anchor.row.feedback.id}
          id="current-anchor"
          className="rounded-sm bg-brand-100 px-0.5 text-fg-primary underline decoration-brand decoration-2 underline-offset-4"
        >
          {text}
          <AnchorNumber number={anchor.number} current />
        </mark>
      ) : (
        <Link
          key={anchor.row.feedback.id}
          href={hrefFor(anchor.row.feedback.id)}
          className={cn(
            "rounded-sm px-0.5 text-fg-primary underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
            tone,
          )}
          title={`Open feedback ${anchor.number} from ${anchor.row.author.name}`}
        >
          {text}
          <AnchorNumber number={anchor.number} />
        </Link>
      ),
    );
    cursor = end;
  }
  if (cursor < content.length) parts.push(content.slice(cursor));
  return parts;
}

function AnchorNumber({ number, current = false }: { number: number; current?: boolean }) {
  return (
    <sup
      className={cn(
        "ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold no-underline",
        current ? "bg-brand text-action-primary-fg" : "bg-surface-muted text-fg-secondary",
      )}
    >
      {number}
    </sup>
  );
}

function AnchorChip({ anchor, href }: { anchor: Anchor; href: string }) {
  const { row, number, current } = anchor;
  const Icon = row.feedback.sentiment === "positive" ? ThumbsUp : ThumbsDown;
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
          current ? "bg-action-primary-fg text-brand" : "bg-surface-muted text-fg-secondary",
        )}
      >
        {number}
      </span>
      <Icon
        className={cn(
          "size-3",
          current ? "" : row.feedback.sentiment === "positive" ? "text-feedback-success" : "text-feedback-danger",
        )}
        aria-hidden
      />
      <span>{row.author.name}</span>
      <span className={current ? "opacity-80" : "text-fg-tertiary"}>
        · {row.feedback.selection ? "highlight" : "whole answer"}
      </span>
    </>
  );
  const base = "type-caption inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5";
  if (current) {
    return (
      <span className={cn(base, "border-brand bg-brand text-action-primary-fg")} aria-current="true">
        {content}
        <span className="sr-only">(viewing)</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        base,
        "border-border-default bg-surface text-fg-primary hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
    >
      {content}
    </Link>
  );
}
