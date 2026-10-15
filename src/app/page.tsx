import { Suspense } from "react";
import { OverviewFallback, OverviewPage } from "@/components/overview-page";

export default function Page() {
  return (
    <Suspense fallback={<OverviewFallback />}>
      <OverviewPage />
    </Suspense>
  );
}
