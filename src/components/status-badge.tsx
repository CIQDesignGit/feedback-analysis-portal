import { Badge } from "@ciq-dev/ciq-design-system";
import { STATUS_LABEL } from "@/lib/format";
import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  new: "defaultLight",
  in_progress: "secondary",
  resolved: "outline",
  dismissed: "outline",
} as const;

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={cn("whitespace-nowrap", status === "dismissed" && "text-fg-tertiary")}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
