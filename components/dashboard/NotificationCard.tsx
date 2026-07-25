import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/dashboard";

type NotificationCardProps = {
  items: NotificationItem[];
  className?: string;
  title?: string;
};

export function NotificationCard({
  items,
  className,
  title = "الإشعارات",
}: NotificationCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-card-foreground">{title}</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {items.filter((i) => i.unread).length} جديد
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border border-border p-3 transition hover:border-primary/20",
              item.unread && "bg-primary/[0.03]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.unread ? (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{item.time}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
