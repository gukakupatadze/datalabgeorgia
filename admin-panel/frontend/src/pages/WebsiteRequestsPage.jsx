import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Link2,
  LoaderCircle,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { websiteRequestsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Topbar } from "@/components/Topbar";

const URGENCIES = ["low", "medium", "high", "critical"];

function errorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

function requestForm(request) {
  return {
    name: request.name || "",
    email: request.email || "",
    phone: request.phone || "",
    device_type: request.device_type || "",
    device: request.request_type === "contact_message" ? "" : request.device_type || "",
    problem_description: request.problem_description || "",
    urgency: request.urgency || "medium",
    cost_estimate: "",
    target_ticket_code: "",
  };
}

function WebsiteRequestCard({ request, approve, merge, reject, markRead, busy }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(() => requestForm(request));
  const isContact = request.request_type === "contact_message";
  const toggleRequest = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !request.read_at) markRead(request.id);
  };
  const setField = (field) => (event) =>
    setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const payload = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    device_type: form.device_type.trim(),
    device: form.device.trim(),
    problem_description: form.problem_description.trim(),
    urgency: form.urgency,
    cost_estimate:
      form.cost_estimate === "" ? null : Number(form.cost_estimate),
  });

  const approveRequest = () => approve(request.id, payload());
  const mergeRequest = () => {
    const code = Number(String(form.target_ticket_code).replace(/\D/g, ""));
    if (!Number.isInteger(code) || code < 10001) {
      toast.error(t("requests.targetRequired"));
      return;
    }
    merge(request.id, { ...payload(), target_ticket_code: code });
  };

  return (
    <article
      className={`rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md ${request.read_at ? "" : "border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/10"}`}
    >
      <div
        className="flex cursor-pointer flex-col gap-3 rounded-lg sm:flex-row sm:items-center"
        onClick={toggleRequest}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isContact ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>
          {isContact ? <Mail className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isContact ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
              {t(isContact ? "requests.type.contact" : "requests.type.service")}
            </span>
            <h2 className="truncate text-sm font-bold">{request.name}</h2>
            <span className="text-[11px] text-muted-foreground">
              {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(request.created_at))}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium">
            {isContact ? request.subject : request.device_type}
          </p>
          <p className="truncate text-xs text-muted-foreground">{request.problem_description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {request.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{request.phone}</span> : null}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              toggleRequest();
            }}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {t(expanded ? "requests.hide" : "requests.open")}
          </Button>
        </div>
      </div>

      {expanded ? <div className="mt-4 border-t pt-4"><div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("field.fullName")}</Label>
          <Input value={form.name} onChange={setField("name")} />
        </div>
        <div className="space-y-1">
          <Label>{t("field.phone")}</Label>
          <Input value={form.phone} onChange={setField("phone")} />
        </div>
        <div className="space-y-1">
          <Label>{t("auth.email")}</Label>
          <Input type="email" value={form.email} onChange={setField("email")} />
        </div>
        <div className="space-y-1">
          <Label>{t("field.deviceType")}</Label>
          <Input value={form.device_type} onChange={setField("device_type")} />
        </div>
        <div className="space-y-1">
          <Label>{t("field.deviceName")}</Label>
          <Input value={form.device} onChange={setField("device")} />
        </div>
        <div className="space-y-1">
          <Label>{t("field.price")}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.cost_estimate}
            onChange={setField("cost_estimate")}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>{t("requests.urgency")}</Label>
          <Select
            value={form.urgency}
            onValueChange={(urgency) =>
              setForm((previous) => ({ ...previous, urgency }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {URGENCIES.map((urgency) => (
                <SelectItem key={urgency} value={urgency}>
                  {t(`requests.urgency.${urgency}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>{t("field.damage")}</Label>
          <Textarea
            className="min-h-28"
            value={form.problem_description}
            onChange={setField("problem_description")}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t pt-4 lg:grid-cols-[auto_1fr_auto_auto]">
        <Button onClick={approveRequest} disabled={busy} className="gap-2">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {t("requests.approve")}
        </Button>
        <Input
          inputMode="numeric"
          placeholder={t("requests.targetPlaceholder")}
          value={form.target_ticket_code}
          onChange={setField("target_ticket_code")}
        />
        <Button variant="outline" onClick={mergeRequest} disabled={busy} className="gap-2">
          <Link2 className="h-4 w-4" />
          {t("requests.merge")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => reject(request.id)}
          disabled={busy}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <XCircle className="h-4 w-4" />
          {t("requests.reject")}
        </Button>
      </div>
      </div> : null}
    </article>
  );
}

export default function WebsiteRequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [headerSearch, setHeaderSearch] = useState("");

  const requests = useQuery({
    queryKey: ["website-requests"],
    queryFn: websiteRequestsApi.list,
    refetchInterval: 15000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["website-requests"] });
    queryClient.invalidateQueries({ queryKey: ["website-requests", "count"] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["counts"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => websiteRequestsApi.approve(id, payload),
    onSuccess: (ticket) => {
      toast.success(t("requests.approved", { code: ticket.ticket_code }));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("requests.failed"))),
  });
  const mergeMutation = useMutation({
    mutationFn: ({ id, payload }) => websiteRequestsApi.merge(id, payload),
    onSuccess: (ticket) => {
      toast.success(t("requests.merged", { code: ticket.ticket_code }));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("requests.failed"))),
  });
  const rejectMutation = useMutation({
    mutationFn: websiteRequestsApi.reject,
    onSuccess: () => {
      toast.success(t("requests.rejected"));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("requests.failed"))),
  });
  const readMutation = useMutation({
    mutationFn: websiteRequestsApi.markRead,
    onSuccess: (updated) => {
      queryClient.setQueryData(["website-requests"], (current = []) =>
        current.map((request) => request.id === updated.id ? updated : request)
      );
      queryClient.invalidateQueries({ queryKey: ["website-requests", "count"] });
    },
    onError: (error) => toast.error(errorMessage(error, t("requests.failed"))),
  });
  const busy =
    approveMutation.isPending || mergeMutation.isPending || rejectMutation.isPending;
  const visibleRequests = requests.data || [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        title={t("requests.title")}
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
            {t("requests.back")}
          </button>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("notifications.title")}</p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            <button type="button" className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-left text-sm font-semibold text-primary-foreground shadow-sm md:w-full">
              <BellRing className="h-4 w-4" />{t("requests.title")}
            </button>
          </nav>
        </aside>

        <main className="crm-scroll min-w-0 flex-1 overflow-auto bg-muted/20">
          <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-extrabold">{t("requests.title")}</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t("requests.subtitle")}</p>
            </div>

            {requests.isLoading ? (
              <div className="flex justify-center py-16"><LoaderCircle className="h-7 w-7 animate-spin" /></div>
            ) : requests.isError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {t("requests.failed")}
              </p>
            ) : visibleRequests.length ? (
              visibleRequests.map((request) => (
                <WebsiteRequestCard
                  key={request.id}
                  request={request}
                  approve={(id, payload) => approveMutation.mutate({ id, payload })}
                  merge={(id, payload) => mergeMutation.mutate({ id, payload })}
                  reject={(id) => rejectMutation.mutate(id)}
                  markRead={(id) => readMutation.mutate(id)}
                  busy={busy}
                />
              ))
            ) : (
              <div className="rounded-xl border bg-card px-6 py-16 text-center">
                <BellRing className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <h2 className="mt-3 font-bold">{t("requests.emptyTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("requests.empty")}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
