import { CircleAlert, LoaderCircle, LogOut, PackageOpen, UserRound, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { portalApi } from "@/lib/api";

const STATUS_COLORS = {
  new: "border-sky-400 bg-sky-50 dark:bg-sky-950/30",
  in_progress: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
  waiting_for_part: "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
  ready: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  could_not_fix: "border-rose-500 bg-rose-50 dark:bg-rose-950/30",
  picked_up: "border-slate-400 bg-slate-50 dark:bg-slate-950/30",
};

function Price({ value }) {
  if (value === null || value === undefined) return null;
  return <span className="shrink-0 text-sm font-bold tabular-nums">{Number(value).toFixed(2)} ₾</span>;
}

export default function CustomerAccountPage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const ticketsQuery = useQuery({ queryKey: ["customer-portal-tickets"], queryFn: portalApi.tickets });

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 flex h-[58px] items-center border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Wrench className="h-4 w-4" /></div><span className="text-sm font-bold">RepairDesk</span></div>
        <div className="ml-auto flex gap-1 sm:gap-2"><LanguageSwitcher /><ThemeToggle /><Button variant="outline" size="sm" className="gap-2 px-2 sm:px-3" aria-label={t("auth.logout")} onClick={signOut}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("auth.logout")}</span></Button></div>
      </header>
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <section className="mb-5 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></div><div><h1 className="text-lg font-bold">{t("customerAccount.welcome", { name: user?.full_name || "" })}</h1><p className="text-sm text-muted-foreground">{user?.phone}</p></div></div>
          <p className="mt-4 text-sm text-muted-foreground">{t("customerAccount.ticketIntro")}</p>
        </section>
        {ticketsQuery.isLoading ? <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-muted-foreground" /></div> : ticketsQuery.isError ? <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><CircleAlert className="h-5 w-5 shrink-0" />{t("customerAccount.error")}</div> : ticketsQuery.data?.length ? <section className="space-y-3">{ticketsQuery.data.map((ticket) => <article key={`${ticket.ticket_code}-${ticket.updated_at}`} className={`rounded-xl border-l-4 p-4 shadow-sm ${STATUS_COLORS[ticket.status] || "border-border bg-card"}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">#{ticket.ticket_code} · {ticket.device || t("customerAccount.device")}</p><p className="mt-1 text-sm text-muted-foreground">{ticket.issue_description}</p></div><div className="flex items-center gap-3"><Price value={ticket.cost_estimate} /><span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold">{t(`status.${ticket.status}`)}</span></div></div>{ticket.items?.length > 1 ? <div className="mt-3 space-y-2 border-t pt-3">{ticket.items.map((item) => <div key={item.position} className="flex items-center justify-between gap-3 rounded-lg bg-background/55 px-2.5 py-2 text-sm"><span className="min-w-0 truncate">{item.position}. {item.device || t("customerAccount.device")}</span><div className="flex shrink-0 items-center gap-3"><Price value={item.cost_estimate} /><span className="text-xs font-semibold text-muted-foreground">{t(`status.${item.status}`)}</span></div></div>)}</div> : null}<p className="mt-3 text-xs text-muted-foreground">{t("customerAccount.updated")}: {new Date(ticket.updated_at).toLocaleString()}</p></article>)}</section> : <section className="rounded-2xl border bg-card p-10 text-center shadow-sm"><PackageOpen className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{t("customerAccount.empty")}</p></section>}
      </div>
    </main>
  );
}
