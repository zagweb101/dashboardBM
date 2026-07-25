import {
  CardsGridSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <PageHeaderSkeleton />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <CardsGridSkeleton count={4} cols="lg:grid-cols-2 xl:grid-cols-4" />
      <TableSkeleton rows={4} cols={4} />
    </div>
  );
}
