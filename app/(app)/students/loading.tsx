import { ListPageSkeleton } from "@/components/ui/skeleton";

export default function StudentsLoading() {
  return <ListPageSkeleton stats={4} variant="table" />;
}
