import { BarChart3, Bell, ChevronDown, ClipboardList, LogOut, Plus, ReceiptText, Search, UserCog } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { websiteRequestsApi } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Topbar({ title, search, onSearch, onSearchSubmit, onCreate }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = user?.role === "admin";
  const pendingQuery = useQuery({
    queryKey: ["website-requests", "count"],
    queryFn: websiteRequestsApi.count,
    enabled: user?.role === "admin",
    refetchInterval: 15000,
  });
  const pendingCount = pendingQuery.data?.count || 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };
  return (
    <header className="flex h-[52px] items-center gap-3 border-b bg-background/80 px-3 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2 shrink-0">
        <img src="/images/datalab-logo.png" alt="DataLab Georgia" className="h-8 w-8 rounded-md object-contain" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">
            {t("app.name")}
          </div>
          <div className="text-[11px] text-muted-foreground">{title}</div>
        </div>
      </div>

      <div className="relative mx-auto hidden w-full max-w-[520px] md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="global-search-input"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onSearchSubmit) {
              onSearchSubmit(event.currentTarget.value);
            }
          }}
          placeholder={t("search.placeholder")}
          className="h-9 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        {canCreate ? (
          <Button
            data-testid="create-ticket-button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("btn.newTicket")}</span>
          </Button>
        ) : null}
        {user?.role === "admin" ? (
          <>
            <Button variant={location.pathname === "/" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => navigate("/")} aria-label={t("nav.ticketsPage")} title={t("nav.ticketsPage")}>
              <ClipboardList className="h-4 w-4" />
            </Button>
            <Button variant={location.pathname === "/analytics" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => navigate("/analytics")} aria-label={t("analytics.title")} title={t("analytics.title")}>
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant={location.pathname === "/users" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => navigate("/users")} aria-label={t("users.title")} title={t("users.title")}>
              <UserCog className="h-4 w-4" />
            </Button>
            <Button variant={location.pathname === "/invoices" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => navigate("/invoices")} aria-label={t("invoices.title")} title={t("invoices.title")}>
              <ReceiptText className="h-4 w-4" />
            </Button>
            <Button variant={location.pathname === "/requests" ? "secondary" : "ghost"} size="icon" className="relative h-9 w-9" onClick={() => navigate("/requests")} aria-label={t("requests.title")} title={t("requests.title")}>
              <Bell className="h-4 w-4" />
              {pendingCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{pendingCount > 99 ? "99+" : pendingCount}</span> : null}
            </Button>
          </>
        ) : null}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2">
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={user?.picture_url || undefined} alt="" />
                <AvatarFallback className="text-[10px] font-bold">
                  {initials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden max-w-[130px] text-left leading-tight lg:block">
                <div className="truncate text-xs font-semibold">{user?.full_name}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {user?.role ? t(`role.${user.role}`) : ""}
                </div>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="truncate text-sm">{user?.full_name}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            {user?.role === "admin" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/")}>
                  <ClipboardList />
                  {t("nav.ticketsPage")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/users")}>
                  <UserCog />
                  {t("users.title")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/analytics")}>
                  <BarChart3 />
                  {t("analytics.title")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/invoices")}>
                  <ReceiptText />
                  {t("invoices.title")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/requests")}>
                  <Bell />
                  {t("requests.title")}
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
