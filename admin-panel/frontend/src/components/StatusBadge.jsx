import { badgeStyle } from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }) {
  const { t } = useI18n();
  return (
    <span
      data-testid="ticket-status-badge"
      style={badgeStyle(status)}
      className={cn(
        "inline-flex items-center rounded-md border border-border/50 px-2 py-0.5 text-[11px] font-medium leading-none",
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
