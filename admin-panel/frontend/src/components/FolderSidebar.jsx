import { NAV } from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function sumCounts(counts, statuses) {
  if (!counts) return 0;
  return statuses.reduce((acc, s) => acc + (counts[s] ?? 0), 0);
}

function CountPill({ value, active }) {
  return (
    <span
      className={cn(
        "tabular ml-auto rounded-full px-2 py-0.5 text-[11px]",
        active
          ? "bg-background text-foreground"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {value}
    </span>
  );
}

export function FolderSidebar({ activeView, onSelect, counts, hideClosed = false }) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-1 pt-3">
        <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("folders.title")}
        </div>
      </div>

      <nav className="crm-scroll flex-1 space-y-0.5 overflow-auto p-2 pt-1">
        {NAV.filter((node) => !(hideClosed && node.id === "closed")).map((node) => {
          const Icon = node.icon;
          if (node.type === "item") {
            const active = activeView === node.id;
            const count = sumCounts(counts, node.statuses);
            return (
              <button
                key={node.id}
                type="button"
                data-testid={`nav-item-${node.id}`}
                onClick={() => onSelect(node.id)}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-ring" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(node.labelKey)}</span>
                <CountPill value={count} active={active} />
              </button>
            );
          }

          const groupActive = activeView === node.id;
          return (
            <div key={node.id} className="pt-1">
              <button
                type="button"
                data-testid={`nav-group-${node.id}`}
                onClick={() => onSelect(node.id)}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  groupActive
                    ? "bg-accent font-medium text-foreground"
                    : "text-foreground/90 hover:bg-accent/60"
                )}
              >
                {groupActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-ring" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">{t(node.labelKey)}</span>
                <CountPill value={sumCounts(counts, node.statuses)} active={groupActive} />
              </button>
              <div className="mt-0.5 space-y-0.5 pl-3">
                {node.children.map((child) => {
                  const ChildIcon = child.icon;
                  const active = activeView === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      data-testid={`nav-item-${child.id}`}
                      onClick={() => onSelect(child.id)}
                      className={cn(
                        "relative flex w-full items-center gap-2 rounded-md border-l px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "border-l-ring bg-accent font-medium text-foreground"
                          : "border-l-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t(child.labelKey)}</span>
                      <CountPill value={sumCounts(counts, child.statuses)} active={active} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3 text-[11px] text-muted-foreground">
        {t("folders.total", { n: counts?.total ?? 0 })}
      </div>
    </div>
  );
}
