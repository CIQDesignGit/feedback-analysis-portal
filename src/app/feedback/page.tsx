import { Suspense } from "react";
import { FeedbackLog, FeedbackLogFallback } from "@/components/feedback-log";

export default function Page() {
  return (
    <Suspense fallback={<FeedbackLogFallback />}>
      <FeedbackLog />
    </Suspense>
  );
}
