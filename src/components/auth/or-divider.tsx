/**
 * 폼 사이의 "또는" 구분선.
 */

interface OrDividerProps {
  label?: string;
}

export function OrDivider({ label = "또는" }: OrDividerProps) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
