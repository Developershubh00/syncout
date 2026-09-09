import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-raised", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="w-[168px]">
      <Skeleton className="h-[210px] w-full rounded-[18px]" />
      <Skeleton className="mt-2.5 h-3.5 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </div>
  );
}
