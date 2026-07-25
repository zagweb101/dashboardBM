import { ListPageSkeleton } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return <ListPageSkeleton stats={4} variant="table" />;
}
