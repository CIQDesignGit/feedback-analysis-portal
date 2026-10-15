import { TAG_LABEL, isPositiveTag } from "@/lib/format";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TagChip({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span
      className={cn(
        "type-caption inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5",
        isPositiveTag(tag)
          ? "border-feedback-success-border bg-feedback-success-subtle text-feedback-success"
          : "border-feedback-danger/30 bg-feedback-danger/5 text-feedback-danger",
        className,
      )}
    >
      {TAG_LABEL[tag]}
    </span>
  );
}

export function TagList({ tags, max }: { tags: Tag[]; max?: number }) {
  const shown = max ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {hidden > 0 ? (
        <span
          className="type-caption rounded-md border border-border-default px-2 py-0.5 text-fg-secondary"
          title={tags.slice(shown.length).map((tag) => TAG_LABEL[tag]).join(", ")}
        >
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}
