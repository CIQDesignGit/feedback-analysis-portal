"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  EmptyState,
  Skeleton,
  enqueueToast,
} from "@ciq-dev/ciq-design-system";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { LoadError } from "@/components/load-error";
import { SentimentBadge } from "@/components/sentiment-badge";
import { StatusBadge } from "@/components/status-badge";
import { getFeedback, setActionState, updateFeedback } from "@/lib/api";
import { feedbackCode } from "@/lib/format";
import { parseListQuery } from "@/lib/list-query";
import type { ActionState, FeedbackDetail as Detail, FeedbackPatch } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import {
  ActionsCard,
  ActivityCard,
  FeedbackCard,
  SiblingList,
  TrackingCard,
} from "./feedback-panel";
import { Transcript } from "./transcript";

export function FeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const load = useCallback(
    () => getFeedback(id, parseListQuery(new URLSearchParams(searchKey))),
    [id, searchKey],
  );
  const requestKey = `${id}?${searchKey}`;
  const { phase: queryPhase, data } = useQuery(requestKey, load);
  const [override, setOverride] = useState<{ key: string; item: Detail } | null>(null);
  const [saving, setSaving] = useState(false);
  const item = override?.key === requestKey ? override.item : data;

  const listParams = new URLSearchParams(searchKey);
  listParams.delete("error");
  const suffix = listParams.toString() ? `?${listParams.toString()}` : "";
  const hrefFor = (target: string) => `/feedback/${target}${suffix}`;
  const logHref = `/feedback${suffix}`;

  async function run(task: () => Promise<void>) {
    setSaving(true);
    try {
      await task();
      const fresh = await getFeedback(id, parseListQuery(listParams));
      if (fresh) setOverride({ key: requestKey, item: fresh });
      return true;
    } catch {
      enqueueToast({ title: "Couldn't save that change", description: "Try again in a moment.", variant: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  const save = (patch: FeedbackPatch) => run(() => updateFeedback(id, patch));
  const act = (actionId: string, state: ActionState) => {
    void run(() => setActionState(id, actionId, state));
  };

  if (queryPhase === "loading") return <FeedbackDetailFallback />;
  if (queryPhase === "error") return <LoadError message="Couldn't load this feedback." />;
  if (!item) {
    return (
      <EmptyState
        title="Feedback not found"
        description="This feedback doesn't exist. It may have come from an old link."
      >
        <Button asChild variant="outline">
          <Link href="/feedback">Go to the feedback log</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={logHref}>Feedback log</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{feedbackCode(item.feedback.id)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-heading text-fg-primary">Feedback {feedbackCode(item.feedback.id)}</h2>
            <SentimentBadge sentiment={item.feedback.sentiment} />
            <StatusBadge status={item.status} />
          </div>
        </div>
        <nav aria-label="Move through the log" className="flex items-center gap-2">
          {item.position ? (
            <span className="type-caption text-fg-tertiary">
              {item.position} of {item.listTotal} in this view
            </span>
          ) : null}
          <StepButton href={item.prevId ? hrefFor(item.prevId) : null} label="Previous feedback">
            <ChevronLeft className="size-4" aria-hidden /> Previous
          </StepButton>
          <StepButton href={item.nextId ? hrefFor(item.nextId) : null} label="Next feedback">
            Next <ChevronRight className="size-4" aria-hidden />
          </StepButton>
        </nav>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Transcript
          conversation={item.conversation}
          user={item.conversationUser}
          current={item}
          siblings={item.siblings}
          hrefFor={hrefFor}
        />
        <aside className="flex flex-col gap-4" aria-label="Feedback details and actions">
          <FeedbackCard item={item} />
          <SiblingList item={item} hrefFor={hrefFor} />
          <ActionsCard item={item} saving={saving} onAction={act} />
          <TrackingCard item={item} saving={saving} onSave={save} />
          <ActivityCard key={item.feedback.id} item={item} saving={saving} onSave={save} />
        </aside>
      </div>
    </div>
  );
}

function StepButton({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

export function FeedbackDetailFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 w-80" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-[480px] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
