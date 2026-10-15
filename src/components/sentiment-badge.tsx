import { ThumbsDown, ThumbsUp } from "lucide-react";
import { SENTIMENT_LABEL } from "@/lib/format";
import type { Sentiment } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<Sentiment, string> = {
  positive: "bg-feedback-success-subtle text-feedback-success",
  negative: "bg-feedback-danger/10 text-feedback-danger",
};

export function SentimentIcon({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  const Icon = sentiment === "positive" ? ThumbsUp : ThumbsDown;
  return (
    <span
      className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full", TONE[sentiment], className)}
      role="img"
      aria-label={SENTIMENT_LABEL[sentiment]}
    >
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const Icon = sentiment === "positive" ? ThumbsUp : ThumbsDown;
  return (
    <span className={cn("type-caption-strong inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5", TONE[sentiment])}>
      <Icon className="size-3" aria-hidden />
      {SENTIMENT_LABEL[sentiment]}
    </span>
  );
}
