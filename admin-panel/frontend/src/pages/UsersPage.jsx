import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, LogOut, ShieldCheck, UserPlus, Users, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Topbar } from "@/components/Topbar";

const ROLES = ["admin", "customer"];

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function errorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "customer", phone: "", company_name: "", tax_id: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [approvalRoles, setApprovalRoles] = useState({});
  const [headerSearch, setHeaderSearch] = useState("");

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["users", "pending-count"] });
  };
  const createUser = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success(t("users.created"));
      setForm({ full_name: "", email: "", password: "", role: "customer", phone: "", company_name: "", tax_id: "" });
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("users.error"))),
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: () => {
      toast.success(t("users.updated"));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("users.error"))),
  });
  const revokeSessions = useMutation({
    mutationFn: usersApi.revokeSessions,
    onSuccess: () => toast.success(t("users.sessionsRevoked")),
    onError: (error) => toast.error(errorMessage(error, t("users.error"))),
  });
  const approveUser = useMutation({
    mutationFn: ({ id, role }) => usersApi.approve(id, role),
    onSuccess: () => {
      toast.success(t("users.approved"));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("users.error"))),
  });
  const rejectUser = useMutation({
    mutationFn: usersApi.reject,
    onSuccess: () => {
      toast.success(t("users.rejected"));
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, t("users.error"))),
  });

  const pendingUsers = (usersQuery.data || []).filter((entry) => entry.approval_status === "pending");
  const managedUsers = (usersQuery.data || []).filter((entry) => entry.approval_status !== "pending");

  const submit = (event) => {
    event.preventDefault();
    createUser.mutate({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim(),
      company_name: form.company_name.trim(),
      tax_id: form.tax_id.trim(),
    });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        title={t("users.title")}
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
            {t("users.back")}
          </button>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("users.adminMenu")}</p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            <button type="button" className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-left text-sm font-semibold text-primary-foreground shadow-sm md:w-full">
              <Users className="h-4 w-4" />{t("users.title")}
            </button>
          </nav>
        </aside>

        <main className="crm-scroll min-w-0 flex-1 overflow-auto bg-muted/20">
          <div className="mx-auto grid w-full max-w-6xl gap-5 p-4 lg:grid-cols-[340px_1fr] lg:p-6">
        {pendingUsers.length ? (
          <section className="overflow-hidden rounded-xl border border-amber-500/30 bg-card shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">{t("users.pendingTitle")}</h2>
                <p className="text-xs text-muted-foreground">{t("users.pendingCount", { count: pendingUsers.length })}</p>
              </div>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">{pendingUsers.length}</span>
            </div>
            <div className="divide-y">
              {pendingUsers.map((entry) => {
                const selectedRole = approvalRoles[entry.id] || entry.role;
                return (
                  <article key={entry.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{entry.full_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email}{entry.phone ? ` · ${entry.phone}` : ""}</p>
                      {entry.company_name ? <p className="mt-1 text-xs text-muted-foreground">{entry.company_name}{entry.tax_id ? ` · ${entry.tax_id}` : ""}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">{t("users.registeredWith")}: {entry.registration_method === "google" ? "Google" : t("auth.emailPassword")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={selectedRole} onValueChange={(role) => setApprovalRoles((old) => ({ ...old, [entry.id]: role }))}>
                        <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{t(`role.${role}`)}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" className="h-9 gap-1.5" disabled={approveUser.isPending || rejectUser.isPending} onClick={() => approveUser.mutate({ id: entry.id, role: selectedRole })}><CheckCircle2 className="h-4 w-4" />{t("users.approve")}</Button>
                      <Button size="sm" variant="outline" className="h-9 gap-1.5 text-destructive" disabled={approveUser.isPending || rejectUser.isPending} onClick={() => rejectUser.mutate(entry.id)}><XCircle className="h-4 w-4" />{t("users.reject")}</Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
        <section className="h-fit rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-[82px]">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <h2 className="text-sm font-bold">{t("users.addTitle")}</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-full-name">{t("users.fullName")}</Label>
              <Input id="user-full-name" value={form.full_name} minLength={2} required onChange={(e) => setForm((old) => ({ ...old, full_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">{t("auth.email")}</Label>
              <Input id="user-email" type="email" placeholder="name@gmail.com" required value={form.email} onChange={(e) => setForm((old) => ({ ...old, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">{t("auth.password")}</Label>
              <div className="relative">
                <Input id="user-password" type={showPassword ? "text" : "password"} minLength={8} required value={form.password} onChange={(e) => setForm((old) => ({ ...old, password: e.target.value }))} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setShowPassword((old) => !old)} aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("users.role")}</Label>
              <Select value={form.role} onValueChange={(role) => setForm((old) => ({ ...old, role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => <SelectItem key={role} value={role}>{t(`role.${role}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.role === "customer" ? <div className="space-y-1.5"><Label htmlFor="user-phone">{t("auth.phone")}</Label><Input id="user-phone" type="tel" required value={form.phone} onChange={(e) => setForm((old) => ({ ...old, phone: e.target.value }))} /></div> : null}
            <Button className="w-full gap-2" disabled={createUser.isPending}>
              {createUser.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {t("users.addButton")}
            </Button>
          </form>
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
            {t("users.inviteHint")}
          </p>
        </section>

        <section className="min-w-0 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">{t("users.listTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("users.count", { count: managedUsers.length })}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>

          {usersQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : usersQuery.isError ? (
            <div className="p-6 text-center text-sm text-destructive">{t("users.error")}</div>
          ) : (
            <div className="divide-y">
              {managedUsers.map((entry) => {
                const isSelf = entry.id === currentUser?.id;
                return (
                  <article key={entry.id} className={`p-4 ${entry.is_active ? "" : "bg-muted/40 opacity-70"}`}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={entry.picture_url || undefined} alt="" />
                          <AvatarFallback className="text-xs font-bold">{initials(entry.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{entry.full_name}</p>
                            {isSelf ? <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{t("users.you")}</span> : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                          {entry.approval_status === "rejected" ? <p className="mt-0.5 text-[11px] font-medium text-destructive">{t("users.statusRejected")}</p> : null}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {entry.last_login_at ? `${t("users.lastLogin")}: ${new Date(entry.last_login_at).toLocaleString()}` : t("users.neverLoggedIn")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={entry.role} disabled={updateUser.isPending} onValueChange={(role) => updateUser.mutate({ id: entry.id, payload: { role } })}>
                          <SelectTrigger className="h-9 w-[145px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => <SelectItem key={role} value={role}>{t(`role.${role}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-xs">
                          {entry.is_active ? t("users.active") : t("users.disabled")}
                          <Switch checked={entry.is_active} disabled={isSelf || updateUser.isPending} onCheckedChange={(is_active) => updateUser.mutate({ id: entry.id, payload: { is_active } })} />
                        </label>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={isSelf || revokeSessions.isPending} onClick={() => revokeSessions.mutate(entry.id)}>
                          <LogOut className="h-3.5 w-3.5" />
                          {t("users.revoke")}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
          </div>
        </main>
      </div>
    </div>
  );
}
