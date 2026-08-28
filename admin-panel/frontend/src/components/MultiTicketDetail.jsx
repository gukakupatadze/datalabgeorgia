import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  History,
  MessageSquareText,
  Package,
  Pencil,
  Plus,
  Save,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyableTicketCode } from "@/components/CopyableTicketCode";
import {
  ACCESSORIES,
  DAMAGE_CATEGORIES,
  DEVICE_TYPES,
  STATUS_ORDER,
  rowStyle,
} from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ITEM_FIELD_KEYS = {
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
  item_added: "items.added",
  item_removed: "items.removed",
};

const itemForm = (item) => ({
  device_type: item?.device_type || "",
  device: item?.device || "",
  serial_number: item?.serial_number || "",
  damage_category: item?.damage_category || "other",
  issue_description: item?.issue_description || "",
  cost_estimate:
    item?.cost_estimate === null || item?.cost_estimate === undefined
      ? ""
      : String(item.cost_estimate),
  urgent: !!item?.urgent,
  accessories: Array.isArray(item?.accessories) ? item.accessories : [],
  accessories_other: item?.accessories_other || "",
});

function resultKind(item) {
  if (
    item.status === "could_not_fix" ||
    (item.status === "picked_up" && item.resolution === "not_fixed")
  ) {
    return "failed";
  }
  if (
    item.status === "ready" ||
    (item.status === "picked_up" && item.resolution === "fixed")
  ) {
    return "fixed";
  }
  return "active";
}

function itemCardStyle(item) {
  const result = resultKind(item);
  if (result === "fixed") {
    return {
      backgroundColor: "hsl(var(--status-ready-tint))",
      borderColor: "hsl(var(--status-ready-accent))",
    };
  }
  if (result === "failed") {
    return {
      backgroundColor: "hsl(var(--status-could_not_fix-tint))",
      borderColor: "hsl(var(--status-could_not_fix-accent))",
    };
  }
  return rowStyle(item.status);
}

function ReadValue({ label, value, wide, mono }) {
  return (
    <div className={cn("space-y-1", wide && "md:col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        className={cn(
          "min-h-9 whitespace-pre-wrap rounded-md bg-secondary/45 px-3 py-2 text-sm",
          mono && "font-mono",
          !value && "italic text-muted-foreground"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function displayActivityValue(value, field, t) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (field === "damage_category") return t(`damage.${value}`);
  if (field === "device_type") return t(`device.${value}`);
  return String(value);
}

function ItemActivity({ activity, t, dateLocale }) {
  const when = (() => {
    try {
      return format(new Date(activity.created_at), "dd MMM yyyy · HH:mm", {
        locale: dateLocale,
      });
    } catch {
      return "";
    }
  })();
  return (
    <li className="relative border-l pl-4 pb-4 last:pb-0">
      <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-primary" />
      <p className="text-[11px] text-muted-foreground">{when}</p>
      {activity.type === "status_change" ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={activity.from_status} />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <StatusBadge status={activity.to_status} />
        </div>
      ) : activity.type === "updated" && activity.changes?.length ? (
        <div className="mt-1 space-y-1.5">
          {activity.changes.filter((change) => change.field !== "assigned_technician").map((change, index) => (
            <div key={`${change.field}-${index}`} className="rounded bg-secondary/50 p-2 text-xs">
              <p className="font-medium text-muted-foreground">
                {t(ITEM_FIELD_KEYS[change.field] || change.field)}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground line-through">
                  {displayActivityValue(change.from_value, change.field, t)}
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">
                  {displayActivityValue(change.to_value, change.field, t)}
                </span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm">{activity.message}</p>
      )}
    </li>
  );
}

function AutoGrowTextarea({ value, className, ...props }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const borderHeight = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borderHeight + 2}px`;
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      className={cn("resize-none overflow-hidden", className)}
      {...props}
    />
  );
}

function InnerTicketPanel({
  ticketCode,
  item,
  itemCount,
  activities,
  onClose,
  onAddNote,
  onUpdateItem,
  onRemoveItem,
  savingItem,
  addingNote,
  permissions = {},
}) {
  const { t, dateLocale } = useI18n();
  const [form, setForm] = useState(() => itemForm(item));
  const [editingItem, setEditingItem] = useState(false);
  const [itemPanelView, setItemPanelView] = useState("details");
  const [note, setNote] = useState("");
  const committing = useRef(false);
  const canManageCustomer = permissions.canManageCustomer !== false;
  const canDelete = permissions.canDelete !== false;
  const canWorkItem = canManageCustomer;

  useEffect(() => {
    if (!editingItem) setForm(itemForm(item));
  }, [item, editingItem]);

  useEffect(() => {
    if (!addingNote) committing.current = false;
  }, [addingNote]);

  const setField = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const setValue = (key) => (value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const toggleAccessory = (key) => {
    setForm((previous) => {
      const selected = previous.accessories.includes(key);
      if (key === "no_accessories") {
        return { ...previous, accessories: selected ? [] : ["no_accessories"] };
      }
      const base = previous.accessories.filter(
        (entry) => entry !== "no_accessories"
      );
      return {
        ...previous,
        accessories: selected
          ? base.filter((entry) => entry !== key)
          : [...base, key],
      };
    });
  };

  const saveItem = () => {
    if (
      !form.device_type ||
      !form.device.trim() ||
      !form.damage_category ||
      !form.issue_description.trim()
    ) {
      toast.error(t("toast.itemRequired"));
      return;
    }
    let cost = null;
    if (form.cost_estimate !== "") {
      cost = Number(form.cost_estimate);
      if (!Number.isFinite(cost) || cost < 0) {
        toast.error(t("toast.costPositive"));
        return;
      }
    }
    onUpdateItem(
      item.id,
      {
        ...form,
        device_type: form.device_type.trim(),
        device: form.device.trim(),
        serial_number: form.serial_number.trim(),
        damage_category: form.damage_category,
        issue_description: form.issue_description.trim(),
        cost_estimate: cost,
        accessories_other: form.accessories_other.trim(),
      },
      () => setEditingItem(false)
    );
  };

  const commitPrice = () => {
    const current =
      item.cost_estimate === null || item.cost_estimate === undefined
        ? ""
        : String(item.cost_estimate);
    if (form.cost_estimate === current) return;

    let cost = null;
    if (form.cost_estimate !== "") {
      cost = Number(form.cost_estimate);
      if (!Number.isFinite(cost) || cost < 0) {
        toast.error(t("toast.costPositive"));
        setForm((previous) => ({ ...previous, cost_estimate: current }));
        return;
      }
    }
    onUpdateItem(item.id, { cost_estimate: cost });
  };

  const commitNote = () => {
    const message = note.trim();
    if (!message || committing.current) return;
    committing.current = true;
    onAddNote(message, () => setNote(""), item.id);
  };

  const deviceLabel = item.device_type
    ? DEVICE_TYPES.includes(item.device_type)
      ? t(`device.${item.device_type}`)
      : item.device_type
    : "";
  const result = resultKind(item);

  return (
    <section
      data-testid="inner-ticket-panel"
      className="-mt-2 shrink-0 overflow-hidden rounded-b-lg rounded-t-none border-2 border-t-0 bg-background shadow-sm"
      style={{
        borderColor: itemCardStyle(item).borderColor,
        order: 11 + item.position * 2,
      }}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-b px-3 py-2.5",
          result === "fixed" && "bg-emerald-50 dark:bg-emerald-950/40",
          result === "failed" && "bg-red-50 dark:bg-red-950/40"
        )}
      >
        <button
          type="button"
          data-testid="inner-ticket-panel-toggle"
          aria-expanded="true"
          onClick={onClose}
          className="flex min-h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CopyableTicketCode
            code={`${ticketCode}-${item.position}`}
            className="text-sm"
            testId="inner-ticket-panel-code"
          />
          <StatusBadge status={item.status} />
        </button>
        {canDelete ? <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              data-testid="inner-ticket-delete-button"
              aria-label={t("items.remove")}
              title={t("items.remove")}
              disabled={itemCount <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("items.removeTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("items.removeDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="inner-ticket-delete-cancel">
                {t("delete.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid="inner-ticket-delete-confirm"
                onClick={() => onRemoveItem(item.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("delete.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog> : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={t("items.close")}
          title={t("items.close")}
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-background/80 p-0.5">
            <Button
              data-testid="inner-ticket-details-tab"
              type="button"
              variant={itemPanelView === "details" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setItemPanelView("details")}
            >
              {t("items.detailsTab")}
            </Button>
            <Button
              data-testid="inner-ticket-activity-tab"
              type="button"
              variant={itemPanelView === "activity" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => setItemPanelView("activity")}
            >
              <History className="h-3.5 w-3.5" /> {t("activity.title")}
            </Button>
          </div>
          <Select
            value={item.status}
            onValueChange={(status) => onUpdateItem(item.id, { status })}
            disabled={savingItem || !canWorkItem}
          >
            <SelectTrigger
              data-testid="inner-ticket-status"
              className="ml-auto h-8 w-[160px] text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {editingItem ? (
            <>
              <Button size="sm" className="h-8" onClick={saveItem} disabled={savingItem}>
                <Save className="mr-1.5 h-4 w-4" /> {t("detail.save")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingItem(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : canManageCustomer ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setItemPanelView("details");
                setEditingItem(true);
              }}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> {t("detail.edit")}
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid-cols-1 gap-3 p-3 md:grid-cols-2",
          itemPanelView === "details" ? "grid" : "hidden"
        )}
      >
        {editingItem ? (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("field.deviceType")} *</Label>
              <Select value={form.device_type} onValueChange={setValue("device_type")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{t(`device.${type}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("field.serialNumber")}</Label>
              <Input value={form.serial_number} onChange={setField("serial_number")} className="h-9" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("field.deviceName")} *</Label>
              <Input value={form.device} onChange={setField("device")} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("field.price")}</Label>
              <Input type="number" min="0" step="0.01" value={form.cost_estimate} onChange={setField("cost_estimate")} className="h-9" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("field.damageCategory")} *</Label>
              <Select value={form.damage_category} onValueChange={setValue("damage_category")}>
                <SelectTrigger data-testid="inner-ticket-damage-category" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{t(`damage.${category}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("field.damage")} *</Label>
              <AutoGrowTextarea
                data-testid="inner-ticket-damage-input"
                value={form.issue_description}
                onChange={setField("issue_description")}
                className="min-h-[90px]"
              />
            </div>
            <div className="space-y-2 rounded-md border p-3 md:col-span-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> {t("field.accessories")}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map((accessory) => (
                  <label key={accessory} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.accessories.includes(accessory)}
                      onCheckedChange={() => toggleAccessory(accessory)}
                    />
                    {t(`acc.${accessory}`)}
                  </label>
                ))}
              </div>
              <Input
                value={form.accessories_other}
                onChange={setField("accessories_other")}
                className="h-9"
                placeholder={t("ph.accessoriesOther")}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-red-600" /> {t("field.urgent")}
              </Label>
              <Switch
                checked={form.urgent}
                onCheckedChange={(urgent) =>
                  setForm((previous) => ({ ...previous, urgent }))
                }
              />
            </div>
          </>
        ) : (
          <>
            <ReadValue label={t("field.deviceType")} value={deviceLabel} />
            <ReadValue label={t("field.deviceName")} value={item.device} />
            {item.serial_number ? (
              <ReadValue label={t("field.serialNumber")} value={item.serial_number} mono />
            ) : null}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("field.price")}</Label>
              <div className="relative">
                <Input
                  data-testid="inner-ticket-price-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost_estimate}
                  onChange={setField("cost_estimate")}
                  onBlur={commitPrice}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-9 pr-9 tabular"
                  placeholder="0.00"
                  disabled={savingItem || !canWorkItem}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  ₾
                </span>
              </div>
            </div>
            <ReadValue
              label={t("field.damageCategory")}
              value={t(`damage.${item.damage_category || "other"}`)}
            />
            <ReadValue label={t("field.damage")} value={item.issue_description} wide />
            <ReadValue
              label={t("field.accessories")}
              value={[
                ...(item.accessories || []).map((entry) => t(`acc.${entry}`)),
                item.accessories_other,
              ]
                .filter(Boolean)
                .join(", ")}
              wide
            />
          </>
        )}
      </div>

      <div
        data-testid="inner-ticket-comment-panel"
        className={cn(
          "border-t bg-secondary/15 p-3",
          itemPanelView === "activity" ? "block" : "hidden"
        )}
      >
        <h4 className="flex items-center gap-1.5 text-sm font-bold">
          <MessageSquareText className="h-4 w-4" /> {t("items.commentTitle")}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("items.commentHint", { code: `#${ticketCode}-${item.position}` })}
        </p>
        <Textarea
          data-testid="inner-ticket-comment-input"
          value={note}
          disabled={!canWorkItem}
          onChange={(event) => setNote(event.target.value)}
          onBlur={commitNote}
          placeholder={t("items.commentPlaceholder")}
          className="mt-2 min-h-[76px] bg-background"
        />
        <div className="mt-2 flex justify-end">
          <Button
            data-testid="inner-ticket-comment-submit"
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={commitNote}
            disabled={!canWorkItem || !note.trim() || addingNote}
          >
            <Plus className="mr-1.5 h-4 w-4" /> {t("items.commentAdd")}
          </Button>
        </div>
      </div>

      <div
        data-testid="inner-ticket-history-panel"
        className={cn(
          "border-t p-3",
          itemPanelView === "activity" ? "block" : "hidden"
        )}
      >
        <h4 className="flex items-center gap-1.5 text-sm font-bold">
          <History className="h-4 w-4" /> {t("items.history")}
        </h4>
        {activities.length ? (
          <ul className="mt-3">
            {activities.map((activity) => (
              <ItemActivity
                key={activity.id}
                activity={activity}
                t={t}
                dateLocale={dateLocale}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">{t("activity.empty")}</p>
        )}
      </div>
    </section>
  );
}

export function MultiTicketDetail({
  ticket,
  activities = [],
  onUpdate,
  onDelete,
  onAddNote,
  onUpdateItem,
  onRemoveItem,
  onRequestAddItem,
  savingItem,
  addingNote,
  permissions = {},
}) {
  const { t } = useI18n();
  const [expandedItemIds, setExpandedItemIds] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    customer_name: ticket.customer_name,
    customer_phone: ticket.customer_phone,
    company_name: ticket.company_name || "",
    tax_id: ticket.tax_id || "",
  });
  useEffect(() => {
    const availableIds = new Set(ticket.items.map((item) => item.id));
    setExpandedItemIds((current) =>
      current.filter((itemId) => availableIds.has(itemId))
    );
  }, [ticket.items]);

  useEffect(() => {
    if (!editingCustomer) {
      setCustomerForm({
        customer_name: ticket.customer_name,
        customer_phone: ticket.customer_phone,
        company_name: ticket.company_name || "",
        tax_id: ticket.tax_id || "",
      });
    }
  }, [ticket, editingCustomer]);

  const summary = useMemo(() => {
    const values = { fixed: 0, failed: 0, active: 0 };
    ticket.items.forEach((item) => {
      values[resultKind(item)] += 1;
    });
    return values;
  }, [ticket.items]);

  const saveCustomer = () => {
    if (!customerForm.customer_name.trim() || !customerForm.customer_phone.trim()) {
      toast.error(t("toast.required"));
      return;
    }
    onUpdate(
      {
        customer_name: customerForm.customer_name.trim(),
        customer_phone: customerForm.customer_phone.trim(),
        company_name: customerForm.company_name.trim(),
        tax_id: customerForm.tax_id.trim(),
      },
      () => setEditingCustomer(false)
    );
  };

  const toggleItem = (itemId) => {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    );
  };

  return (
    <div className="crm-fade-in flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/90 p-3 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CopyableTicketCode
                code={ticket.ticket_code}
                className="text-base"
                testId="multi-ticket-header-code"
              />
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                {t("items.count", { n: ticket.items.length })}
              </span>
              {summary.fixed > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {summary.fixed}
                </span>
              ) : null}
              {summary.failed > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                  <XCircle className="h-3.5 w-3.5" /> {summary.failed}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {ticket.customer_type === "legal" && ticket.company_name
                ? `${ticket.company_name} · `
                : ""}
              {ticket.customer_name}
            </p>
          </div>
          {permissions.canAddItem !== false ? <Button
            data-testid="multi-ticket-add-item"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onRequestAddItem}
          >
            <Plus className="h-4 w-4" />
            {t("items.add")}
          </Button> : null}
          {permissions.canDelete !== false ? <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
                <AlertDialogDescription>{t("delete.desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                  {t("delete.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog> : null}
        </div>
      </div>

      <div className="crm-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
        <section className="rounded-lg border bg-background p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
              {ticket.customer_type === "legal" ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            {editingCustomer ? (
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  value={customerForm.customer_name}
                  onChange={(event) =>
                    setCustomerForm((previous) => ({
                      ...previous,
                      customer_name: event.target.value,
                    }))
                  }
                  placeholder={t("field.fullName")}
                />
                <Input
                  value={customerForm.customer_phone}
                  onChange={(event) =>
                    setCustomerForm((previous) => ({
                      ...previous,
                      customer_phone: event.target.value,
                    }))
                  }
                  placeholder={t("field.phone")}
                />
                {ticket.customer_type === "legal" ? (
                  <>
                    <Input
                      value={customerForm.company_name}
                      onChange={(event) =>
                        setCustomerForm((previous) => ({
                          ...previous,
                          company_name: event.target.value,
                        }))
                      }
                      placeholder={t("field.companyName")}
                    />
                    <Input
                      value={customerForm.tax_id}
                      onChange={(event) =>
                        setCustomerForm((previous) => ({
                          ...previous,
                          tax_id: event.target.value,
                        }))
                      }
                      placeholder={t("field.taxId")}
                    />
                  </>
                ) : null}
                <div className="flex gap-2 md:col-span-2">
                  <Button size="sm" onClick={saveCustomer}>
                    <Save className="mr-1.5 h-4 w-4" /> {t("detail.save")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingCustomer(false)}>
                    {t("detail.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                {ticket.customer_type === "legal" && ticket.company_name ? (
                  <p className="font-semibold">{ticket.company_name}</p>
                ) : null}
                <p className="font-semibold">{ticket.customer_name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{ticket.customer_phone}</p>
                {ticket.tax_id ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{ticket.tax_id}</p>
                ) : null}
              </div>
            )}
            {!editingCustomer && permissions.canManageCustomer !== false ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </section>

        <section className="contents">
          <div className="mt-1 flex items-center justify-between" style={{ order: 1 }}>
            <h3 className="text-sm font-bold">{t("items.title")}</h3>
            <span className="text-xs text-muted-foreground">{t("items.openHint")}</span>
          </div>
          <div className="contents">
            {ticket.items.map((item) => {
              const kind = resultKind(item);
              const isExpanded = expandedItemIds.includes(item.id);
              return (
                <div key={item.id} className="contents">
                  <button
                    type="button"
                    data-testid="inner-ticket-row"
                    aria-expanded={isExpanded}
                    onClick={() => toggleItem(item.id)}
                    style={{ ...itemCardStyle(item), order: 10 + item.position * 2 }}
                    className={cn(
                      "w-full rounded-lg border-2 p-3 text-left transition-shadow hover:shadow-sm",
                      isExpanded && "rounded-b-none border-b-0 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CopyableTicketCode
                        code={`${ticket.ticket_code}-${item.position}`}
                        className="text-sm"
                        testId="inner-ticket-row-code"
                      />
                      {item.urgent ? (
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {t("badge.urgent")}
                        </span>
                      ) : null}
                      <span className="ml-auto">
                        <StatusBadge status={item.status} />
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold">{item.device}</span>
                      {item.cost_estimate !== null &&
                      item.cost_estimate !== undefined ? (
                        <span className="shrink-0 text-sm font-bold tabular">
                          {Number(item.cost_estimate).toFixed(2)} ₾
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="min-w-0 flex-1 truncate">
                        {item.issue_description}
                      </span>
                      {kind === "fixed" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                      ) : kind === "failed" ? (
                        <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                      ) : null}
                    </div>
                  </button>
                  {isExpanded ? (
                    <InnerTicketPanel
                      ticketCode={ticket.ticket_code}
                      item={item}
                      itemCount={ticket.items.length}
                      activities={activities.filter(
                        (activity) => activity.item_id === item.id
                      )}
                      onClose={() => toggleItem(item.id)}
                      onAddNote={onAddNote}
                      onUpdateItem={onUpdateItem}
                      onRemoveItem={onRemoveItem}
                      savingItem={savingItem}
                      addingNote={addingNote}
                      permissions={permissions}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
