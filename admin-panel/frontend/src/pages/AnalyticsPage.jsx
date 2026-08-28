import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, subDays, subMonths } from "date-fns";
import { enUS, ka } from "date-fns/locale";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CalendarRange,
  CircleCheck,
  CircleX,
  LayoutDashboard,
  Laptop,
  PackageOpen,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GEL = new Intl.NumberFormat("ka-GE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function MetricCard({ icon: Icon, label, value, detail, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <Card>
      <CardContent className="flex min-h-[92px] items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 truncate text-xl font-bold tracking-tight">{value}</div>
          {detail ? <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HorizontalChart({ title, subtitle, data, dataKey, color, valueFormatter, emptyLabel }) {
  const chartData = (data || []).slice(0, 10);
  const height = Math.max(260, chartData.length * 44 + 50);
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {chartData.length ? (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 480, height }}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={155} tick={{ fontSize: 11 }} tickFormatter={(value) => value.length > 25 ? `${value.slice(0, 25)}…` : value} />
                <Tooltip formatter={(value) => valueFormatter(value)} />
                <Bar dataKey={dataKey} fill={color} radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisTable({ title, subtitle, rows, kind, t, labelFor, totalRevenue }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex min-w-[205px] items-center justify-center gap-3 border-l px-5 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Banknote className="h-4 w-4" />
            </div>
            <div className="text-center leading-none">
              <div className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">{t("analytics.totalRevenue")}</div>
              <div className="mt-2 text-lg font-bold tabular-nums text-foreground">{GEL.format(totalRevenue || 0)} ₾</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-2">
        {rows.length ? (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-y bg-secondary/35 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("analytics.categories")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.tableReceived")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.tableFixed")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.tableFailed")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.tableActive")}</th>
                {kind === "damage" ? <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.successRate")}</th> : null}
                <th className="px-3 py-2.5 text-right font-semibold">{t("analytics.tableRevenue")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("analytics.tableAverage")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = kind === "damage" ? row.damage : row.device_type;
                return (
                  <tr key={key} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-semibold">{labelFor(key)}</td>
                    <td className="tabular px-3 py-3 text-right">{row.count}</td>
                    <td className="tabular px-3 py-3 text-right text-emerald-700">{row.fixed_items}</td>
                    <td className="tabular px-3 py-3 text-right text-red-700">{row.failed_items}</td>
                    <td className="tabular px-3 py-3 text-right">{row.active_items}</td>
                    {kind === "damage" ? <td className="tabular px-3 py-3 text-right">{row.success_rate.toFixed(1)}%</td> : null}
                    <td className="tabular px-3 py-3 text-right font-semibold">{GEL.format(row.revenue)} ₾</td>
                    <td className="tabular px-4 py-3 text-right">{GEL.format(row.average_revenue)} ₾</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">{t("analytics.empty")}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const currentDate = useMemo(() => new Date(), []);
  const [section, setSection] = useState("overview");
  const [headerSearch, setHeaderSearch] = useState("");
  const initialRange = useMemo(() => ({ from: subMonths(currentDate, 1), to: currentDate }), [currentDate]);
  const [dateRange, setDateRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateFrom = format(dateRange.from, "yyyy-MM-dd");
  const dateTo = format(dateRange.to, "yyyy-MM-dd");
  const isDailyTrend = differenceInCalendarDays(dateRange.to, dateRange.from) <= 61;
  const updateDraftDate = (key, value) => {
    const selected = parseLocalDate(value);
    if (!selected) return;
    setDraftRange((old) => {
      if (key === "from") {
        return { from: selected, to: old?.to && old.to >= selected ? old.to : selected };
      }
      return { from: old?.from && old.from <= selected ? old.from : selected, to: selected };
    });
  };

  const query = useQuery({
    queryKey: ["analytics", "custom", dateFrom, dateTo],
    queryFn: () => analyticsApi.overview({ period: "custom", date_from: dateFrom, date_to: dateTo }),
  });
  const data = query.data;
  const dateLocale = lang === "ka" ? ka : enUS;

  const translated = (prefix, value) => {
    const key = `${prefix}.${value}`;
    const result = t(key);
    return result === key ? value : result;
  };
  const damageLabel = (value) => translated("damage", value);
  const deviceLabel = (value) => translated("device", value);
  const damageRows = data?.damage_categories || [];
  const deviceRows = data?.device_types || [];
  const trend = data?.trend || [];
  const commonDamage = (data?.common_damage || []).map((row) => ({ ...row, label: damageLabel(row.damage) }));
  const revenueDamage = (data?.revenue_damage || []).map((row) => ({ ...row, label: damageLabel(row.damage) }));
  const failedDamage = (data?.failed_damage || []).map((row) => ({ ...row, label: damageLabel(row.damage) }));
  const devicesByCount = deviceRows.map((row) => ({ ...row, label: deviceLabel(row.device_type) }));
  const devicesByRevenue = [...devicesByCount].sort((a, b) => b.revenue - a.revenue);
  const devicesByFailed = [...devicesByCount].sort((a, b) => b.failed_items - a.failed_items);
  const nav = [
    { id: "overview", icon: LayoutDashboard, label: t("analytics.nav.overview") },
    { id: "damage", icon: TriangleAlert, label: t("analytics.nav.damage") },
    { id: "devices", icon: Laptop, label: t("analytics.nav.devices") },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        title={t("analytics.title")}
        search={headerSearch}
        onSearch={setHeaderSearch}
        onSearchSubmit={(value) => navigate("/", { state: { search: value } })}
        onCreate={() => navigate("/", { state: { openCreate: true } })}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b bg-[hsl(var(--surface-1))] p-3 md:w-64 md:border-b-0 md:border-r">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm font-semibold shadow-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("analytics.back")}
          </button>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("analytics.title")}</p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {nav.map(({ id, icon: Icon, label }) => (
              <button key={id} type="button" onClick={() => setSection(id)} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors md:w-full", section === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground") }>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="crm-scroll min-w-0 flex-1 overflow-auto bg-muted/20">
          <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3 shadow-sm">
              <Popover open={calendarOpen} onOpenChange={(open) => {
                setCalendarOpen(open);
                if (open) setDraftRange(dateRange);
              }}>
                <PopoverTrigger asChild>
                  <Button data-testid="analytics-date-range" variant="outline" className="h-10 min-w-[290px] justify-start gap-2 bg-background text-left font-medium">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    <span>{format(dateRange.from, "d MMM yyyy", { locale: dateLocale })} — {format(dateRange.to, "d MMM yyyy", { locale: dateLocale })}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
                  <div className="grid grid-cols-2 gap-3 border-b bg-muted/30 p-3 text-xs">
                    <label className="space-y-1.5">
                      <span className="text-muted-foreground">{t("analytics.dateFrom")}</span>
                      <Input type="date" className="h-9 bg-background" max={format(currentDate, "yyyy-MM-dd")} value={draftRange?.from ? format(draftRange.from, "yyyy-MM-dd") : ""} onChange={(event) => updateDraftDate("from", event.target.value)} />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-muted-foreground">{t("analytics.dateTo")}</span>
                      <Input type="date" className="h-9 bg-background" min={draftRange?.from ? format(draftRange.from, "yyyy-MM-dd") : undefined} max={format(currentDate, "yyyy-MM-dd")} value={draftRange?.to ? format(draftRange.to, "yyyy-MM-dd") : ""} onChange={(event) => updateDraftDate("to", event.target.value)} />
                    </label>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={draftRange?.from}
                    selected={draftRange}
                    onSelect={setDraftRange}
                    min={0}
                    numberOfMonths={2}
                    locale={dateLocale}
                    disabled={{ after: currentDate }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDraftRange({ from: currentDate, to: currentDate })}>{t("analytics.today")}</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDraftRange({ from: subDays(currentDate, 6), to: currentDate })}>{t("analytics.lastWeek")}</Button>
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => setDraftRange(initialRange)}>
                        <RotateCcw className="h-3.5 w-3.5" />{t("analytics.lastMonth")}
                      </Button>
                    </div>
                    <Button type="button" size="sm" disabled={!draftRange?.from || !draftRange?.to} onClick={() => {
                      setDateRange({ from: draftRange.from, to: draftRange.to });
                      setCalendarOpen(false);
                    }}>{t("analytics.applyRange")}</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">{t("analytics.defaultRange")}</span>
              <span className="ml-auto text-xs text-muted-foreground">{t("analytics.completionBasis")}</span>
            </div>

            {query.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</div>
            ) : query.isError ? (
              <Card><CardContent className="p-6 text-sm text-destructive">{t("analytics.error")}</CardContent></Card>
            ) : section === "overview" ? (
              <>
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <MetricCard icon={CalendarDays} label={t("analytics.receivedTickets")} value={data.received_tickets} />
                  <MetricCard icon={PackageOpen} label={t("analytics.receivedItems")} value={data.received_items} />
                  <MetricCard icon={CircleCheck} label={t("analytics.fixedItems")} value={data.fixed_items} tone="green" />
                  <MetricCard icon={CircleX} label={t("analytics.failedItems")} value={data.failed_items} tone="red" />
                  <MetricCard icon={Banknote} label={t("analytics.revenue")} value={`${GEL.format(data.revenue)} ₾`} tone="amber" />
                </section>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{isDailyTrend ? t("analytics.dailyTrend") : t("analytics.monthlyTrend")}</CardTitle></CardHeader>
                  <CardContent><div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 900, height: 340 }}>
                      <ComposedChart data={trend} margin={{ left: 4, right: 12, top: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} /><XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis yAxisId="money" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value, name) => name === t("analytics.revenue") ? `${GEL.format(value)} ₾` : value} /><Legend />
                        <Bar yAxisId="count" dataKey="received_items" name={t("analytics.receivedItems")} fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="count" dataKey="fixed_items" name={t("analytics.fixedItems")} fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="count" dataKey="failed_items" name={t("analytics.failedItems")} fill="#dc2626" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="money" type="monotone" dataKey="revenue" name={t("analytics.revenue")} stroke="#d97706" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div></CardContent>
                </Card>
              </>
            ) : section === "damage" ? (
              <>
                <section className="grid gap-3 md:grid-cols-3">
                  <MetricCard icon={TriangleAlert} label={t("analytics.commonDamage")} value={commonDamage[0]?.label || "—"} detail={commonDamage[0] ? `${commonDamage[0].count} ${t("analytics.itemsUnit")}` : null} />
                  <MetricCard icon={Banknote} label={t("analytics.revenueDamage")} value={revenueDamage[0]?.label || "—"} detail={revenueDamage[0] ? `${GEL.format(revenueDamage[0].revenue)} ₾` : null} tone="amber" />
                  <MetricCard icon={CircleX} label={t("analytics.failedDamage")} value={failedDamage[0]?.label || "—"} detail={failedDamage[0] ? `${failedDamage[0].failed_items} ${t("analytics.itemsUnit")}` : null} tone="red" />
                </section>
                <section className="grid items-start gap-4 xl:grid-cols-3">
                  <HorizontalChart title={t("analytics.commonDamage")} subtitle={t("analytics.commonDamageHint")} data={commonDamage} dataKey="count" color="#64748b" valueFormatter={(value) => [value, t("analytics.itemsUnit")]} emptyLabel={t("analytics.empty")} />
                  <HorizontalChart title={t("analytics.revenueDamage")} subtitle={t("analytics.revenueDamageHint")} data={revenueDamage} dataKey="revenue" color="#d97706" valueFormatter={(value) => [`${GEL.format(value)} ₾`, t("analytics.revenue")]} emptyLabel={t("analytics.empty")} />
                  <HorizontalChart title={t("analytics.failedDamage")} subtitle={t("analytics.failedDamageHint")} data={failedDamage} dataKey="failed_items" color="#dc2626" valueFormatter={(value) => [value, t("analytics.itemsUnit")]} emptyLabel={t("analytics.empty")} />
                </section>
                <AnalysisTable title={t("analytics.damageBreakdown")} subtitle={t("analytics.damageBreakdownHint")} rows={damageRows} kind="damage" t={t} labelFor={damageLabel} totalRevenue={data.revenue} />
              </>
            ) : (
              <>
                <section className="grid gap-3 md:grid-cols-3">
                  <MetricCard icon={Laptop} label={t("analytics.deviceMostCommon")} value={devicesByCount[0]?.label || "—"} detail={devicesByCount[0] ? `${devicesByCount[0].count} ${t("analytics.itemsUnit")}` : null} />
                  <MetricCard icon={Banknote} label={t("analytics.deviceTopRevenue")} value={devicesByRevenue[0]?.label || "—"} detail={devicesByRevenue[0] ? `${GEL.format(devicesByRevenue[0].revenue)} ₾` : null} tone="amber" />
                  <MetricCard icon={CircleX} label={t("analytics.deviceTopFailed")} value={devicesByFailed[0]?.label || "—"} detail={devicesByFailed[0] ? `${devicesByFailed[0].failed_items} ${t("analytics.itemsUnit")}` : null} tone="red" />
                </section>
                <section className="grid items-start gap-4 xl:grid-cols-2">
                  <HorizontalChart title={t("analytics.deviceMostCommon")} subtitle={t("analytics.deviceBreakdownHint")} data={devicesByCount} dataKey="count" color="#64748b" valueFormatter={(value) => [value, t("analytics.itemsUnit")]} emptyLabel={t("analytics.empty")} />
                  <HorizontalChart title={t("analytics.deviceTopRevenue")} subtitle={t("analytics.deviceBreakdownHint")} data={devicesByRevenue} dataKey="revenue" color="#d97706" valueFormatter={(value) => [`${GEL.format(value)} ₾`, t("analytics.revenue")]} emptyLabel={t("analytics.empty")} />
                </section>
                <AnalysisTable title={t("analytics.deviceBreakdown")} subtitle={t("analytics.deviceBreakdownHint")} rows={deviceRows} kind="device" t={t} labelFor={deviceLabel} totalRevenue={data.revenue} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
