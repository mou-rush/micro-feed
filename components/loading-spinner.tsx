import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
