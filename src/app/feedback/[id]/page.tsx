import { Suspense } from "react";
import {
  FeedbackDetail,
  FeedbackDetailFallback,
} from "@/components/feedback-detail/feedback-detail";

export default function Page() {
  return (
    <Suspense fallback={<FeedbackDetailFallback />}>
      <FeedbackDetail />
    </Suspense>
  );
}
