import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Trash2,
  Save,
  Plus,
  History,
  ArrowRight,
  FileText,
  MousePointerClick,
  User,
  Building2,
  Pencil,
  X,
  AlertTriangle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import { AddTicketItemDialog } from "@/components/AddTicketItemDialog";
import { MultiTicketDetail } from "@/components/MultiTicketDetail";
import { CopyableTicketCode } from "@/components/CopyableTicketCode";
import {
  STATUS_ORDER,
  accentColor,
  DAMAGE_CATEGORIES,
  DEVICE_TYPES,
  ACCESSORIES,
} from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function toForm(ticket) {
  return {
    customer_type: ticket?.customer_type || "physical",
    customer_name: ticket?.customer_name ?? "",
    company_name: ticket?.company_name ?? "",
    tax_id: ticket?.tax_id ?? "",
    customer_phone: ticket?.customer_phone ?? "",
    device_type: ticket?.device_type ?? "other",
    device: ticket?.device ?? "",
    serial_number: ticket?.serial_number ?? "",
    damage_category: ticket?.damage_category ?? "other",
    cost_estimate:
      ticket?.cost_estimate === null || ticket?.cost_estimate === undefined
        ? ""
        : String(ticket.cost_estimate),
    issue_description: ticket?.issue_description ?? "",
    urgent: !!ticket?.urgent,
    accessories: Array.isArray(ticket?.accessories) ? ticket.accessories : [],
    accessories_other: ticket?.accessories_other ?? "",
  };
}

function EmptyDetail() {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <MousePointerClick className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{t("detail.empty.title")}</p>
        <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
          {t("detail.empty.desc")}
        </p>
      </div>
    </div>
  );
}

function ReadField({ label, value, fullWidth, mono, className }) {
  return (
    <div className={cn("space-y-1", fullWidth && "md:col-span-2", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        className={cn(
          "min-h-[36px] whitespace-pre-wrap rounded-md bg-secondary/40 px-3 py-2 text-sm",
          mono && "font-mono",
          !value && "italic text-muted-foreground"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

const ACTIVITY_FIELD_LABELS = {
  customer_type: "field.customerType",
  customer_name: "field.fullName",
  company_name: "field.companyName",
  tax_id: "field.taxId",
  customer_phone: "field.phone",
  device_type: "field.deviceType",
  device: "field.deviceName",
  serial_number: "field.serialNumber",
  damage_category: "field.damageCategory",
  issue_description: "field.damage",
  cost_estimate: "field.price",
  part_info: "field.partInfo",
  urgent: "field.urgent",
  accessories: "field.accessories",
  accessories_other: "acc.other",
};

function activityValue(field, value, t) {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "urgent") {
    return t(value ? "activity.enabled" : "activity.disabled");
  }
  if (field === "customer_type") {
    return t(value === "legal" ? "field.legal" : "field.physical");
  }
  if (field === "device_type") return t(`device.${value}`);
  if (field === "damage_category") return t(`damage.${value}`);
  if (field === "accessories") {
    if (!Array.isArray(value) || value.length === 0) return "—";
    return value.map((item) => t(`acc.${item}`)).join(", ");
  }
  if (field === "cost_estimate") {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `${new Intl.NumberFormat("ka-GE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)} ₾`
      : String(value);
  }
  return String(value);
}

function ActivityItem({ activity }) {
  const { t, dateLocale } = useI18n();
  const isStatus = activity.type === "status_change";
  const isCreated = activity.type === "created";
  const isUpdated = activity.type === "updated";
  return (
    <li data-testid="ticket-activity-timeline-item" className="relative pb-4">
      <span
        className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background"
        style={{
          backgroundColor: activity.to_status
            ? accentColor(activity.to_status)
            : "hsl(var(--muted-foreground) / 0.6)",
        }}
      />
      <div className="tabular text-[11px] text-muted-foreground">
        {format(new Date(activity.created_at), "d MMM yyyy · HH:mm", {
          locale: dateLocale,
        })}
      </div>
      {isStatus ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
          {activity.from_status && <StatusBadge status={activity.from_status} />}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          {activity.to_status && <StatusBadge status={activity.to_status} />}
        </div>
      ) : isCreated ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
          <span>{t("activity.created")}</span>
          {activity.to_status && <StatusBadge status={activity.to_status} />}
        </div>
      ) : isUpdated ? (
        <div className="mt-1 space-y-1.5">
          <div className="text-sm font-medium">{t("activity.updated")}</div>
          {(activity.changes || []).filter((change) => change.field !== "assigned_technician").map((change, index) => (
            <div
              key={`${change.field}-${index}`}
              data-testid="ticket-activity-change"
              className="rounded-md bg-secondary/45 px-2 py-1.5 text-xs"
            >
              <div className="font-medium text-muted-foreground">
                {t(ACTIVITY_FIELD_LABELS[change.field] || change.field)}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="break-words text-muted-foreground line-through decoration-border">
                  {activityValue(change.field, change.from_value, t)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="break-words font-medium text-foreground">
                  {activityValue(change.field, change.to_value, t)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 whitespace-pre-wrap text-sm">{activity.message}</div>
      )}
    </li>
  );
}

function SingleTicketDetail({
  ticket,
  isLoading,
  activities,
  companies = [],
  customers = [],
  onUpdate,
  onStatusChange,
  onDelete,
  onAddNote,
  onRequestAddItem,
  savingStatus,
  savingField,
  addingNote,
  permissions = {},
}) {
  const { t, dateLocale } = useI18n();
  const [form, setForm] = useState(() => toForm(ticket));
  const [note, setNote] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [priceView, setPriceView] = useState("");
  const committing = useRef(false);
  const previousTicketId = useRef(ticket?.id);

  useEffect(() => {
    const selectedTicketChanged = previousTicketId.current !== ticket?.id;

    // Always reset when selecting another ticket. For the same ticket, sync
    // background/server updates only outside edit mode so unsaved work survives.
    if (selectedTicketChanged) {
      previousTicketId.current = ticket?.id;
      setNote("");
      setEditMode(false);
    }
    if (selectedTicketChanged || !editMode) {
      setForm(toForm(ticket));
      setPriceView(
        ticket?.cost_estimate === null || ticket?.cost_estimate === undefined
          ? ""
          : String(ticket.cost_estimate)
      );
    }
  }, [ticket, editMode]);

  useEffect(() => {
    if (!addingNote) committing.current = false;
  }, [addingNote]);

  const dirty = useMemo(() => {
    if (!ticket) return false;
    return JSON.stringify(toForm(ticket)) !== JSON.stringify(form);
  }, [form, ticket]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!ticket) return <EmptyDetail />;

  const canManageCustomer = permissions.canManageCustomer !== false;
  const canAddItem = permissions.canAddItem !== false;
  const canDelete = permissions.canDelete !== false;
  const canWorkTicket = canManageCustomer;

  const isLegal = form.customer_type === "legal";
  const setField = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((prev) => ({ ...prev, [k]: v }));

  const toggleAccessory = (key) => {
    setForm((prev) => {
      const has = prev.accessories.includes(key);
      return {
        ...prev,
        accessories: has
          ? prev.accessories.filter((a) => a !== key)
          : [...prev.accessories, key],
      };
    });
  };

  // Legal-entity auto-fill: typing a known company name fills the rest.
  const handleCompanyChange = (e) => {
    const val = e.target.value;
    const match = customers.find(
      (c) => c.company_name && c.company_name === val.trim()
    );
    setForm((prev) => {
      const next = { ...prev, company_name: val };
      if (match) {
        next.tax_id = match.tax_id || next.tax_id;
        next.customer_name = match.customer_name || next.customer_name;
        next.customer_phone = match.customer_phone || next.customer_phone;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (
      !form.customer_name.trim() ||
      !form.customer_phone.trim() ||
      !form.device_type ||
      !form.device.trim() ||
      !form.damage_category ||
      !form.issue_description.trim()
    ) {
      toast.error(t("toast.required"));
      return;
    }
    let cost = null;
    if (form.cost_estimate !== "") {
      const n = Number(form.cost_estimate);
      if (Number.isNaN(n) || n < 0) {
        toast.error(t("toast.costPositive"));
        return;
      }
      cost = n;
    }
    const payload = {
      customer_type: form.customer_type,
      customer_name: form.customer_name.trim(),
      company_name: isLegal ? form.company_name.trim() : "",
      tax_id: isLegal ? form.tax_id.trim() : "",
      customer_phone: form.customer_phone.trim(),
      device_type: form.device_type,
      device: form.device.trim(),
      serial_number: form.serial_number.trim(),
      damage_category: form.damage_category,
      cost_estimate: cost,
      issue_description: form.issue_description,
      urgent: form.urgent,
      accessories: form.accessories,
      accessories_other: form.accessories_other.trim(),
    };
    onUpdate(payload, () => setEditMode(false));
  };

  const handleCancel = () => {
    setForm(toForm(ticket));
    setEditMode(false);
  };

  // Price is editable directly in view mode (no edit mode needed).
  const commitViewPrice = () => {    const current =
      ticket.cost_estimate === null || ticket.cost_estimate === undefined
        ? ""
        : String(ticket.cost_estimate);
    if (priceView === current) return;
    let cost = null;
    if (priceView !== "") {
      const n = Number(priceView);
      if (Number.isNaN(n) || n < 0) {
        toast.error(t("toast.costPositive"));
        setPriceView(current);
        return;
      }
      cost = n;
    }
    onUpdate({ cost_estimate: cost });
  };

  // Save a note on blur (click away) OR button click, guarded against double-save.
  const commitNote = () => {
    const msg = note.trim();
    if (!msg || committing.current) return;
    committing.current = true;
    onAddNote(msg, () => setNote(""));
  };

  const TypeButton = ({ value, icon: Icon, label }) => (
    <button
      type="button"
      data-testid={`detail-customer-type-${value}`}
      onClick={() => setForm((p) => ({ ...p, customer_type: value }))}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        form.customer_type === value
          ? "border-ring bg-accent text-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent/50"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div key={ticket.id} className="crm-fade-in flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 p-3 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CopyableTicketCode
                code={ticket.ticket_code ?? ticket.id.slice(0, 8)}
                className="text-base tracking-tight text-foreground"
                testId="ticket-detail-header-code"
              />
              {ticket.urgent ? (
                <span
                  data-testid="ticket-detail-urgent-badge"
                  className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {t("badge.urgent")}
                </span>
              ) : null}
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {ticket.customer_name}
              </span>
              {ticket.device ? (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  {ticket.device}
                </>
              ) : null}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={onStatusChange}
              disabled={savingStatus || !canWorkTicket}
            >
              <SelectTrigger
                data-testid="ticket-detail-status-select"
                className="h-9 w-[150px] text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {editMode ? (
              <>
                <Button
                  size="sm"
                  className="h-9 gap-1.5"
                  data-testid="ticket-detail-save-button"
                  disabled={savingField}
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                  {savingField ? t("detail.saving") : t("detail.save")}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  data-testid="ticket-detail-cancel-button"
                  aria-label={t("detail.cancel")}
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {canAddItem ? <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  data-testid="ticket-detail-add-item-button"
                  onClick={onRequestAddItem}
                >
                  <Plus className="h-4 w-4" />
                  {t("items.add")}
                </Button> : null}
                {canManageCustomer ? <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  data-testid="ticket-detail-edit-button"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="h-4 w-4" />
                  {t("detail.edit")}
                </Button> : null}
                {canDelete ? <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      data-testid="ticket-detail-delete-button"
                      aria-label={t("delete.trigger")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("delete.desc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="delete-ticket-cancel-button">
                        {t("delete.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="delete-ticket-confirm-button"
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("delete.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog> : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="crm-scroll min-h-0 flex-1 overflow-auto">
        {/* Customer type */}
        <div className="space-y-1 p-3 pb-0">
          <Label className="text-xs text-muted-foreground">
            {t("field.customerType")}
          </Label>
          {editMode ? (
            <div className="flex gap-2">
              <TypeButton value="physical" icon={User} label={t("field.physical")} />
              <TypeButton value="legal" icon={Building2} label={t("field.legal")} />
            </div>
          ) : (
            <div
              data-testid="ticket-detail-customer-type-text"
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary/40 px-3 py-2 text-sm font-medium"
            >
              {isLegal ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              {isLegal ? t("field.legal") : t("field.physical")}
            </div>
          )}
        </div>

        {/* Legal-only fields */}
        {isLegal &&
          (editMode ? (
            <div className="mx-3 mt-3 grid grid-cols-1 gap-3 rounded-md border border-dashed bg-secondary/30 p-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.companyName")}
                </Label>
                <Input
                  data-testid="ticket-detail-company-input"
                  list="detail-company-suggestions"
                  className="h-9"
                  value={form.company_name}
                  onChange={handleCompanyChange}
                  placeholder={t("ph.company")}
                />
                <datalist id="detail-company-suggestions">
                  {companies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.taxId")}
                </Label>
                <Input
                  data-testid="ticket-detail-tax-id-input"
                  className="h-9"
                  value={form.tax_id}
                  onChange={setField("tax_id")}
                />
              </div>
            </div>
          ) : (
            (ticket.company_name || ticket.tax_id) && (
              <div className="mx-3 mt-3 grid grid-cols-1 gap-3 rounded-md border border-dashed bg-secondary/30 p-3 md:grid-cols-2">
                {ticket.company_name ? (
                  <ReadField
                    label={t("field.companyName")}
                    value={ticket.company_name}
                  />
                ) : null}
                {ticket.tax_id ? (
                  <ReadField label={t("field.taxId")} value={ticket.tax_id} />
                ) : null}
              </div>
            )
          ))}

        {/* Fields */}
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
          {editMode ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.fullName")} *
                </Label>
                <Input
                  data-testid="ticket-detail-customer-name-input"
                  className="h-9"
                  value={form.customer_name}
                  onChange={setField("customer_name")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.phone")} *
                </Label>
                <Input
                  data-testid="ticket-detail-customer-phone-input"
                  className="h-9"
                  value={form.customer_phone}
                  onChange={setField("customer_phone")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.deviceType")} *
                </Label>
                <Select value={form.device_type} onValueChange={setVal("device_type")}>
                  <SelectTrigger data-testid="ticket-detail-device-type-input" className="h-9">
                    <SelectValue placeholder={t("ph.deviceType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{t(`device.${type}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.serialNumber")}
                </Label>
                <Input
                  data-testid="ticket-detail-serial-number-input"
                  className="h-9"
                  value={form.serial_number}
                  onChange={setField("serial_number")}
                  placeholder={t("ph.serialNumber")}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  {t("field.deviceName")} *
                </Label>
                <Input
                  data-testid="ticket-detail-device-input"
                  className="h-9"
                  value={form.device}
                  onChange={setField("device")}
                  placeholder={t("ph.deviceName")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.price")}
                </Label>
                <Input
                  data-testid="ticket-detail-estimate-input"
                  className="h-9 tabular"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost_estimate}
                  onChange={setField("cost_estimate")}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  {t("field.damageCategory")} *
                </Label>
                <Select
                  value={form.damage_category}
                  onValueChange={setVal("damage_category")}
                >
                  <SelectTrigger data-testid="ticket-detail-damage-category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`damage.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  {t("field.damage")} *
                </Label>
                <Textarea
                  data-testid="ticket-detail-issue-textarea"
                  className="min-h-[110px]"
                  value={form.issue_description}
                  onChange={setField("issue_description")}
                />
              </div>
              {/* Urgent toggle (edit) */}
              <div className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <Label className="text-sm font-medium">
                    {t("field.urgent")}
                  </Label>
                </div>
                <Switch
                  data-testid="ticket-detail-urgent-switch"
                  checked={form.urgent}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, urgent: v }))}
                />
              </div>
              {/* Accessories checklist (edit) */}
              <div className="space-y-2 rounded-md border p-3 md:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  {t("field.accessories")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <label
                      key={acc}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        data-testid={`detail-accessory-${acc}`}
                        checked={form.accessories.includes(acc)}
                        onCheckedChange={() => toggleAccessory(acc)}
                      />
                      {t(`acc.${acc}`)}
                    </label>
                  ))}
                </div>
                <Input
                  data-testid="detail-accessories-other-input"
                  className="h-9"
                  value={form.accessories_other}
                  onChange={setField("accessories_other")}
                  placeholder={t("ph.accessoriesOther")}
                />
              </div>
            </>
          ) : (
            <>
              <ReadField
                label={t("field.fullName")}
                value={ticket.customer_name}
              />
              <ReadField
                label={t("field.phone")}
                value={ticket.customer_phone}
              />
              <ReadField
                label={t("field.deviceType")}
                value={
                  ticket.device_type
                    ? DEVICE_TYPES.includes(ticket.device_type)
                      ? t(`device.${ticket.device_type}`)
                      : ticket.device_type
                    : ""
                }
              />
              <ReadField label={t("field.deviceName")} value={ticket.device} />
              <ReadField
                label={t("field.damageCategory")}
                value={t(`damage.${ticket.damage_category || "other"}`)}
              />
              {/* serial number — only when it has a value */}
              {ticket.serial_number ? (
                <ReadField
                  label={t("field.serialNumber")}
                  value={ticket.serial_number}
                  mono
                />
              ) : null}
              {/* price — always shown and editable without edit mode */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("field.price")}
                </Label>
                <Input
                  data-testid="ticket-detail-view-price-input"
                  className="h-9 tabular"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={priceView}
                  disabled={!canWorkTicket}
                  onChange={(e) => setPriceView(e.target.value)}
                  onBlur={commitViewPrice}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </div>
              <ReadField
                label={t("field.damage")}
                value={ticket.issue_description}
                fullWidth
              />

              {/* Accessories (read-only) — shown only when present */}
              {(ticket.accessories?.length || ticket.accessories_other) ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {t("field.accessories")}
                  </Label>
                  <div
                    data-testid="ticket-detail-accessories-view"
                    className="flex flex-wrap gap-1.5 rounded-md bg-secondary/40 px-3 py-2"
                  >
                    {(ticket.accessories || []).map((a) => (
                      <span
                        key={a}
                        className="rounded-full border bg-background px-2 py-0.5 text-xs"
                      >
                        {t(`acc.${a}`)}
                      </span>
                    ))}
                    {ticket.accessories_other
                      ? ticket.accessories_other
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((s, i) => (
                            <span
                              key={`o-${i}`}
                              className="rounded-full border bg-background px-2 py-0.5 text-xs"
                            >
                              {s}
                            </span>
                          ))
                      : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <Separator />

        {/* Activity */}
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            {t("activity.title")}
          </div>

          {canWorkTicket ? <div className="mb-4 rounded-md border bg-card p-2">
            <Textarea
              data-testid="ticket-activity-add-note-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={commitNote}
              placeholder={t("activity.notePlaceholder")}
              className="min-h-[64px] border-0 p-1 shadow-none focus-visible:ring-0"
            />
            <div className="flex justify-end">
              <Button
                data-testid="ticket-activity-add-note-button"
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={!note.trim() || addingNote}
                onClick={commitNote}
              >
                <Plus className="h-4 w-4" />
                {t("activity.addNote")}
              </Button>
            </div>
          </div> : null}

          {activities && activities.length > 0 ? (
            <ul className="relative ml-1 border-l pl-5">
              {activities.map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              {t("activity.empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TicketDetail(props) {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const items = props.ticket?.items || [];
  const content =
    items.length > 1 ? (
      <MultiTicketDetail
        {...props}
        onRequestAddItem={() => setAddItemOpen(true)}
      />
    ) : (
      <SingleTicketDetail
        {...props}
        onRequestAddItem={() => setAddItemOpen(true)}
      />
    );

  return (
    <>
      {content}
      <AddTicketItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onAdd={props.onAddItem}
        saving={props.savingItem}
      />
    </>
  );
}
