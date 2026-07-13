/** Full-page loading state — used by Suspense fallback during lazy page load. */
import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading page"
    >
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
