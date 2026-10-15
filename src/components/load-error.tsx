"use client";

import { Button } from "@ciq-dev/ciq-design-system";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Error block whose retry drops the `?error=1` override and reloads the route. */
export function LoadError({ message }: { message: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-border-default bg-surface p-4">
      <p className="type-body text-fg-primary">{message}</p>
      <Button
        variant="outline"
        onClick={() => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("error");
          const query = next.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
      >
        Try again
      </Button>
    </div>
  );
}
