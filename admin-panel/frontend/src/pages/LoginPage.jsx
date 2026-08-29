import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

const ERROR_KEYS = {
  google_cancelled: "auth.error.cancelled",
  invalid_state: "auth.error.expired",
  oauth_failed: "auth.error.failed",
  email_not_verified: "auth.error.unverified",
  access_denied: "auth.error.denied",
  account_mismatch: "auth.error.mismatch",
  registration_pending: "auth.registrationPending",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.24-.2-1.8H12v3.41h5.52a4.72 4.72 0 0 1-2.05 3.1l-.02.12 2.97 2.3.2.02c1.82-1.69 2.98-4.17 2.98-7.15Z" />
      <path fill="#34A853" d="M12 22c2.68 0 4.92-.88 6.56-2.4l-3.15-2.44c-.84.57-1.95.97-3.41.97a5.92 5.92 0 0 1-5.6-4.1l-.12.01-3.1 2.4-.04.11A9.91 9.91 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14.03A6.1 6.1 0 0 1 6.08 12c0-.7.12-1.38.3-2.03v-.12L3.25 7.4l-.1.05A9.98 9.98 0 0 0 2 12c0 1.63.4 3.17 1.14 4.55l3.26-2.52Z" />
      <path fill="#EA4335" d="M12 5.87c1.86 0 3.11.8 3.83 1.46l2.8-2.73C16.9 3 14.68 2 12 2a9.91 9.91 0 0 0-8.86 5.45l3.24 2.52A5.95 5.95 0 0 1 12 5.87Z" />
    </svg>
  );
}

function apiError(error, fallback, t) {
  const detail = error?.response?.data?.detail;
  if (detail?.includes("waiting for administrator")) return t("auth.registrationPending");
  if (detail?.includes("not approved")) return t("auth.registrationRejected");
  if (error?.response?.status === 401) return t("auth.invalidCredentials");
  if (error?.response?.status === 409) return t("auth.emailExists");
  if (error?.response?.status === 429) return t("auth.tooManyAttempts");
  return detail || fallback;
}

function PasswordInput({ id, label, value, onChange, autoComplete = "new-password" }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} required value={value} onChange={onChange} className="pr-10" />
        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setVisible((old) => !old)} aria-label={visible ? "პაროლის დამალვა" : "პაროლის ჩვენება"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading, refreshUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ identifier: "", password: "" });

  useEffect(() => {
    authApi.config().then(setConfig).catch(() => setConfigError(true));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><LoaderCircle className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  if (user) return <Navigate to="/" replace />;

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.login({ identifier: login.identifier.trim(), password: login.password });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(apiError(requestError, t("auth.error.failed"), t));
    } finally {
      setSubmitting(false);
    }
  };

  const oauthError = searchParams.get("error");
  const googleReady = config?.google_configured;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--ring)/0.14),transparent_36%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.08),transparent_34%)]" />
      <div className="absolute right-4 top-4 flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /></div>
      <section className="relative w-full max-w-[460px] rounded-2xl border bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src="/images/datalab-logo.png" alt="DataLab Georgia" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
          <div><h1 className="text-xl font-bold tracking-tight">DataLab Georgia</h1><p className="text-xs text-muted-foreground">{t("auth.secureCrm")}</p></div>
        </div>
        {oauthError ? <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{t(ERROR_KEYS[oauthError] || "auth.error.failed")}</div> : null}
        {configError ? <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{t("auth.error.server")}</div> : null}
        {error ? <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</div> : null}
        <form onSubmit={submitLogin} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="login-identifier">{t("auth.emailOrPhone")}</Label><Input id="login-identifier" autoComplete="username" required placeholder="name@gmail.com / 555 123 456" value={login.identifier} onChange={(event) => setLogin((old) => ({ ...old, identifier: event.target.value }))} /></div>
          <PasswordInput id="login-password" label={t("auth.password")} autoComplete="current-password" value={login.password} onChange={(event) => setLogin((old) => ({ ...old, password: event.target.value }))} />
          <Button className="h-11 w-full gap-2" disabled={submitting}>{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{t("auth.signInButton")}</Button>
        </form>

        <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[11px] uppercase text-muted-foreground">{t("auth.or")}</span><div className="h-px flex-1 bg-border" /></div>
        <Button data-testid="google-login-button" type="button" variant="outline" className="h-11 w-full justify-center gap-3 bg-background text-sm font-semibold shadow-sm" disabled={!googleReady} onClick={() => window.location.assign(authApi.loginUrl)}><GoogleMark />{t("auth.googleButton")}</Button>
        {!googleReady ? <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("auth.googleOptionalSetup")}</p> : null}
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">{t("auth.approvalNote")}</p>
      </section>
    </main>
  );
}
