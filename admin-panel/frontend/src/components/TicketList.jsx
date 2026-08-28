import { formatDistanceToNowStrict } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { accentColor, rowStyle } from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function TicketRow({ ticket, selected, onSelect, t, dateLocale }) {
  const items = Array.isArray(ticket.items) ? ticket.items : [];
  const isMulti = items.length > 1;
  const fixedItems = items.filter(
    (item) =>
      item.status === "ready" ||
      (item.status === "picked_up" && item.resolution === "fixed")
  ).length;
  const failedItems = items.filter(
    (item) =>
      item.status === "could_not_fix" ||
      (item.status === "picked_up" && item.resolution === "not_fixed")
  ).length;
  const activeItems = Math.max(items.length - fixedItems - failedItems, 0);
  const activeStatusCounts = Array.from(
    items.reduce((counts, item) => {
      const isFixed =
        item.status === "ready" ||
        (item.status === "picked_up" && item.resolution === "fixed");
      const isFailed =
        item.status === "could_not_fix" ||
        (item.status === "picked_up" && item.resolution === "not_fixed");
      if (!isFixed && !isFailed) {
        counts.set(item.status, (counts.get(item.status) || 0) + 1);
      }
      return counts;
    }, new Map())
  );
  const relTime = (() => {
    try {
      return formatDistanceToNowStrict(new Date(ticket.created_at), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return "";
    }
  })();
  const createdTime = new Date(ticket.created_at).getTime();
  const isOverdue =
    ticket.status === "new" &&
    Number.isFinite(createdTime) &&
    Date.now() - createdTime >= 24 * 60 * 60 * 1000;

  // Closed / Picked Up color coding: green = repaired, red = could not repair.
  const isPickedUp = ticket.status === "picked_up";
  const resolutionColor =
    isMulti && activeItems > 0
      ? null
      : isMulti && failedItems > 0
      ? "#dc2626"
      : isMulti && activeItems === 0 && fixedItems === items.length
      ? "#16a34a"
      : isPickedUp && ticket.resolution === "fixed"
      ? "#16a34a"
      : isPickedUp && ticket.resolution === "not_fixed"
      ? "#dc2626"
      : null;
  const hasPrice =
    ticket.cost_estimate !== null &&
    ticket.cost_estimate !== undefined &&
    ticket.cost_estimate !== "" &&
    Number.isFinite(Number(ticket.cost_estimate));
  const formattedPrice = hasPrice
    ? `${new Intl.NumberFormat("ka-GE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(ticket.cost_estimate))} ₾`
    : null;

  return (
    <button
      type="button"
      data-testid="ticket-row"
      data-ticket-id={ticket.id}
      onClick={() => onSelect(ticket.id)}
      style={rowStyle(ticket.status)}
      className={cn(
        "group relative w-full overflow-hidden rounded-md border border-border/60 py-2.5 pl-4 pr-3 text-left transition-colors duration-150",
        "hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        ticket.customer_type === "legal" &&
          "border-2 border-slate-900 dark:border-slate-200",
        selected && "ring-2 ring-ring/70"
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ backgroundColor: resolutionColor || "var(--row-accent)" }}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {resolutionColor ? (
              <span
                data-testid={`ticket-resolution-${ticket.resolution}`}
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: resolutionColor }}
              />
            ) : null}
            {ticket.ticket_code ? (
              <span className="tabular shrink-0 font-mono text-sm font-extrabold leading-none text-foreground">
                #{ticket.ticket_code}
              </span>
            ) : null}
            {ticket.urgent ? (
              <span
                data-testid="ticket-urgent-badge"
                className="shrink-0 rounded-md border border-red-700/30 bg-red-600 px-2 py-0.5 text-[11px] font-medium leading-none text-white"
              >
                {t("badge.urgent")}
              </span>
            ) : null}
            {isOverdue ? (
              <span
                data-testid="ticket-overdue-badge"
                className="shrink-0 rounded-md border border-amber-700/30 bg-amber-500 px-2 py-0.5 text-[11px] font-semibold leading-none text-slate-950"
              >
                {t("badge.overdue")}
              </span>
            ) : null}
          </div>
        </div>
        <span className="shrink-0">
          <StatusBadge status={ticket.status} />
        </span>
      </div>

      <div className="mt-2.5 flex min-h-5 items-center justify-between gap-2 text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground/90">
            {isMulti ? t("items.count", { n: items.length }) : ticket.device}
          </span>
          {isMulti && fixedItems > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
              />
              {fixedItems}
            </span>
          ) : null}
          {isMulti && failedItems > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-400"
              />
              {failedItems}
            </span>
          ) : null}
          {isMulti
            ? activeStatusCounts.map(([status, count]) => (
                <span
                  key={status}
                  data-testid={`ticket-active-status-${status}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold"
                  style={{ color: accentColor(status) }}
                  title={`${t(`status.${status}`)}: ${count}`}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accentColor(status) }}
                  />
                  {count}
                </span>
              ))
            : null}
        </div>
        {formattedPrice ? (
          <span
            data-testid="ticket-row-price"
            className="tabular shrink-0 text-sm font-bold text-foreground"
          >
            {formattedPrice}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex min-h-4 items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {isMulti
            ? t("items.progress", {
                fixed: fixedItems,
                failed: failedItems,
                active: activeItems,
              })
            : ticket.issue_description || ""}
        </span>
        <span data-testid="ticket-updated-at" className="tabular shrink-0">
          {relTime}
        </span>
      </div>
    </button>
  );
}

export function TicketList({
  tickets,
  isLoading,
  selectedId,
  onSelect,
  search,
  onSearch,
  resolution,
  onResolution,
  showResolutionFilter,
}) {
  const { t, dateLocale } = useI18n();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 space-y-2 border-b bg-background/80 p-3 backdrop-blur">
        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="ticket-list-search-input"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("list.filters")}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {showResolutionFilter ? (
              <Select value={resolution} onValueChange={onResolution}>
                <SelectTrigger
                  data-testid="ticket-list-resolution-filter"
                  className="h-8 w-[150px] text-xs"
                >
                  <SelectValue placeholder={t("filter.allResults")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.allResults")}</SelectItem>
                  <SelectItem value="fixed">{t("filter.fixed")}</SelectItem>
                  <SelectItem value="not_fixed">{t("filter.not_fixed")}</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>
      </div>

      <div className="crm-scroll min-h-0 flex-1 space-y-1 overflow-auto p-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border/60 p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))
        ) : tickets && tickets.length > 0 ? (
          tickets.map((tk) => (
            <TicketRow
              key={tk.id}
              ticket={tk}
              selected={tk.id === selectedId}
              onSelect={onSelect}
              t={t}
              dateLocale={dateLocale}
            />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("list.empty.title")}</p>
            <p className="max-w-[220px] text-xs text-muted-foreground">
              {search || (showResolutionFilter && resolution !== "all")
                ? t("list.empty.filtered")
                : t("list.empty.default")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
