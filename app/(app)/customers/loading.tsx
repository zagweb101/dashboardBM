import { ListPageSkeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return <ListPageSkeleton stats={4} variant="table" />;
}
