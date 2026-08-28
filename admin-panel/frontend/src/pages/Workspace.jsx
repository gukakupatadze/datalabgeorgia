import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Topbar } from "@/components/Topbar";
import { FolderSidebar } from "@/components/FolderSidebar";
import { TicketList } from "@/components/TicketList";
import { TicketDetail } from "@/components/TicketDetail";
import { CreateTicketDialog } from "@/components/CreateTicketDialog";
import {
  STATUS_VIEW,
  VIEW_STATUSES,
  VIEW_LABEL_KEY,
  MOBILE_VIEWS,
} from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  useCounts,
  useTickets,
  useTicket,
  useActivities,
  useCompanies,
  useCustomers,
  useTicketMutations,
  useDebouncedValue,
} from "@/lib/hooks";

// Extract a human-readable message from an axios/FastAPI error.
function apiError(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail) && detail.length) {
    const d = detail[0];
    const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null;
    return field ? `${field}: ${d.msg}` : d.msg || fallback;
  }
  if (typeof detail === "string") return detail;
  if (err?.message) return err.message;
  return fallback;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

export default function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("incoming");
  const [selectedId, setSelectedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [resolution, setResolution] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const isDesktop = useIsDesktop();
  const { t } = useI18n();
  const { user } = useAuth();
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const activeStatuses = useMemo(
    () => VIEW_STATUSES[activeView] || ["new"],
    [activeView]
  );

  const filters = useMemo(
    () =>
      debouncedSearch.trim()
        ? { q: debouncedSearch.trim() }
        : {
            statuses: activeStatuses.join(","),
            resolution:
              activeView === "closed" && resolution !== "all"
                ? resolution
                : undefined,
          },
    [activeStatuses, activeView, resolution, debouncedSearch]
  );

  const { data: counts } = useCounts();
  const overdueCount = counts?.overdue ?? 0;
  const previousOverdueCount = useRef(0);
  const { data: tickets, isLoading: listLoading } = useTickets(filters);
  const { data: companies } = useCompanies();
  const { data: customers } = useCustomers();
  const { data: ticket, isLoading: ticketLoading } = useTicket(selectedId);
  const { data: activities } = useActivities(selectedId);
  const { create, update, remove, addItem, updateItem, removeItem, addNote } =
    useTicketMutations();

  useEffect(() => {
    const requestedSearch = location.state?.search;
    const requestedCreate = location.state?.openCreate;
    const requestedOverdue = location.state?.overdue;
    if (typeof requestedSearch === "string") setSearchInput(requestedSearch);
    if (requestedCreate) setCreateOpen(true);
    if (requestedOverdue) {
      toast.dismiss("incoming-overdue");
      setSearchInput("");
      setResolution("all");
      setActiveView("incoming");
    }
    if (requestedSearch !== undefined || requestedCreate || requestedOverdue) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (
      !listLoading &&
      selectedId &&
      Array.isArray(tickets) &&
      !tickets.some((entry) => entry.id === selectedId)
    ) {
      setSelectedId(null);
      setMobileDetailOpen(false);
    }
  }, [tickets, listLoading, selectedId]);

  useEffect(() => {
    if (overdueCount > previousOverdueCount.current) {
      toast.warning(t("attention.overdueMessage", { count: overdueCount }), {
        id: "incoming-overdue",
      });
    }
    if (overdueCount === 0) toast.dismiss("incoming-overdue");
    previousOverdueCount.current = overdueCount;
  }, [overdueCount, t]);

  const handleSelectView = (view) => {
    setActiveView(view);
  };

  const handleSelectTicket = (id) => {
    setSelectedId(id);
    if (!isDesktop) setMobileDetailOpen(true);
  };

  const handleCreate = (payload, done) => {
    create.mutate(payload, {
      onSuccess: (newTicket) => {
        toast.success(t("toast.created"));
        setCreateOpen(false);
        setActiveView(STATUS_VIEW[newTicket.status] ?? "incoming");
        setSelectedId(newTicket.id);
        done && done();
      },
      onError: (e) => toast.error(apiError(e, t("toast.failCreate"))),
    });
  };

  const handleUpdate = (payload, done) => {
    update.mutate(
      { id: selectedId, payload },
      {
        onSuccess: () => {
          toast.success(t("toast.updated"));
          done && done();
        },
        onError: (e) => toast.error(apiError(e, t("toast.failSave"))),
      }
    );
  };

  const handleStatusChange = (status) => {
    update.mutate(
      { id: selectedId, payload: { status } },
      {
        onSuccess: () =>
          toast.success(t("toast.movedTo", { status: t(`status.${status}`) })),
        onError: (e) => toast.error(apiError(e, t("toast.failStatus"))),
      }
    );
  };

  const handleDelete = () => {
    const id = selectedId;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(t("toast.deleted"));
        setSelectedId(null);
        setMobileDetailOpen(false);
      },
      onError: (e) => toast.error(apiError(e, t("toast.failDelete"))),
    });
  };

  const handleAddNote = (message, done, itemId) => {
    addNote.mutate(
      { id: selectedId, message, itemId },
      {
        onSuccess: () => {
          toast.success(t("toast.noteAdded"));
          done && done();
        },
        onError: (e) => toast.error(apiError(e, t("toast.failNote"))),
      }
    );
  };

  const handleAddItem = (payload, done) => {
    addItem.mutate(
      { id: selectedId, payload },
      {
        onSuccess: () => {
          toast.success(t("toast.itemAdded"));
          done && done();
        },
        onError: (e) => toast.error(apiError(e, t("toast.failItem"))),
      }
    );
  };

  const handleUpdateItem = (itemId, payload, done) => {
    updateItem.mutate(
      { id: selectedId, itemId, payload },
      {
        onSuccess: () => {
          toast.success(t("toast.updated"));
          done && done();
        },
        onError: (e) => toast.error(apiError(e, t("toast.failSave"))),
      }
    );
  };

  const handleRemoveItem = (itemId) => {
    removeItem.mutate(
      { id: selectedId, itemId },
      {
        onSuccess: () => toast.success(t("toast.itemRemoved")),
        onError: (e) => toast.error(apiError(e, t("toast.failItem"))),
      }
    );
  };

  const detailProps = {
    ticket,
    isLoading: ticketLoading && !!selectedId,
    activities,
    companies,
    customers,
    onUpdate: handleUpdate,
    onStatusChange: handleStatusChange,
    onDelete: handleDelete,
    onAddNote: handleAddNote,
    onAddItem: handleAddItem,
    onUpdateItem: handleUpdateItem,
    onRemoveItem: handleRemoveItem,
    savingStatus: update.isPending,
    savingField: update.isPending,
    addingNote: addNote.isPending,
    savingItem: addItem.isPending || updateItem.isPending || removeItem.isPending,
  };

  const listProps = {
    tickets,
    isLoading: listLoading,
    selectedId,
    onSelect: handleSelectTicket,
    search: searchInput,
    onSearch: setSearchInput,
    resolution,
    onResolution: setResolution,
    showResolutionFilter: activeView === "closed",
  };

  const viewTitle = t(VIEW_LABEL_KEY[activeView] || "nav.incoming");
  const permissions = {
    role: user?.role,
    fullName: user?.full_name || "",
    canManageCustomer: user?.role === "admin",
    canAddItem: user?.role === "admin",
    canDelete: user?.role === "admin",
  };

  detailProps.permissions = permissions;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        title={viewTitle}
        search={searchInput}
        onSearch={setSearchInput}
        onCreate={() => setCreateOpen(true)}
      />

      {isDesktop ? (
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize={20} minSize={16} maxSize={28}>
            <FolderSidebar
              activeView={activeView}
              onSelect={handleSelectView}
              counts={counts}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={33} minSize={24}>
            <TicketList {...listProps} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={47} minSize={30}>
            <div className="h-full bg-[hsl(var(--surface-1))]">
              <TicketDetail {...detailProps} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex gap-1.5 overflow-x-auto border-b p-2">
            {MOBILE_VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => handleSelectView(v)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                  activeView === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {t(VIEW_LABEL_KEY[v])}
                <span className="tabular">
                  {(VIEW_STATUSES[v] || []).reduce(
                    (a, s) => a + (counts?.[s] ?? 0),
                    0
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <TicketList {...listProps} />
          </div>
          <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
            <SheetContent side="right" className="w-full p-0 sm:max-w-md">
              <div className="h-full pt-2">
                <TicketDetail {...detailProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        saving={create.isPending}
        companies={companies}
        customers={customers}
      />
    </div>
  );
}
