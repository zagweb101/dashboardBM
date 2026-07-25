type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
      <p className="text-lg font-bold text-card-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      <p className="mt-6 text-xs text-muted-foreground">
        Structure ready — extend with dashboard components or Supabase data.
      </p>
    </div>
  );
}
