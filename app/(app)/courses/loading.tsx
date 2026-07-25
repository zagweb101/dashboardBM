import { ListPageSkeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return <ListPageSkeleton stats={4} variant="cards" />;
}
