import { useState } from "react";
import { toast } from "sonner";
import { User, Building2, UserCheck, ChevronDown, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESSORIES,
  DAMAGE_CATEGORIES,
  DEVICE_TYPES,
} from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BLANK = {
  customer_type: "physical",
  customer_name: "",
  company_name: "",
  tax_id: "",
  customer_phone: "",
  device_type: "",
  device: "",
  serial_number: "",
  damage_category: "",
  cost_estimate: "",
  issue_description: "",
  urgent: false,
  accessories: [],
  accessories_other: "",
};

export function CreateTicketDialog({
  open,
  onOpenChange,
  onCreate,
  saving,
  companies = [],
  customers = [],
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(BLANK);

  const setField = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((prev) => ({ ...prev, [k]: v }));

  const reset = () => setForm(BLANK);
  const isLegal = form.customer_type === "legal";

  const toggleAccessory = (key) => {
    setForm((prev) => {
      const has = prev.accessories.includes(key);
      if (key === "no_accessories") {
        return { ...prev, accessories: has ? [] : ["no_accessories"] };
      }
      const base = prev.accessories.filter((a) => a !== "no_accessories");
      return {
        ...prev,
        accessories: has ? base.filter((a) => a !== key) : [...base, key],
      };
    });
  };

  const matchedCustomer = customers.find(
    (c) => c.customer_phone && c.customer_phone === form.customer_phone.trim()
  );

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    const match = customers.find(
      (c) => c.customer_phone && c.customer_phone === phone.trim()
    );
    setForm((prev) => {
      const next = { ...prev, customer_phone: phone };
      if (match) {
        next.customer_name = match.customer_name || prev.customer_name;
        next.customer_type = match.customer_type || prev.customer_type;
        next.company_name = match.company_name || "";
        next.tax_id = match.tax_id || "";
      }
      return next;
    });
  };

  const handleSubmit = () => {
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
    onCreate(payload, reset);
  };

  const TypeButton = ({ value, icon: Icon, label }) => (
    <button
      type="button"
      data-testid={`create-customer-type-${value}`}
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[94vh] max-w-[52rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
          <DialogDescription>{t("create.desc")}</DialogDescription>
        </DialogHeader>

        {/* Customer type toggle */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t("field.customerType")}
          </Label>
          <div className="flex gap-2">
            <TypeButton value="physical" icon={User} label={t("field.physical")} />
            <TypeButton value="legal" icon={Building2} label={t("field.legal")} />
          </div>
        </div>

        {/* Legal-only fields */}
        {isLegal && (
          <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed bg-secondary/30 p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("field.companyName")}
              </Label>
              <Input
                data-testid="create-company-input"
                list="company-suggestions"
                value={form.company_name}
                onChange={setField("company_name")}
                className="h-9"
                placeholder={t("ph.company")}
              />
              <datalist id="company-suggestions">
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
                data-testid="create-tax-id-input"
                value={form.tax_id}
                onChange={setField("tax_id")}
                className="h-9"
              />
            </div>
          </div>
        )}

        {/* Main fields in required order */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.fullName")} *
            </Label>
            <Input
              data-testid="create-customer-name-input"
              value={form.customer_name}
              onChange={setField("customer_name")}
              className="h-9"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.phone")} *
            </Label>
            <Input
              data-testid="create-customer-phone-input"
              list="phone-suggestions"
              value={form.customer_phone}
              onChange={handlePhoneChange}
              className="h-9"
              autoComplete="off"
            />
            <datalist id="phone-suggestions">
              {customers.map((c) => (
                <option key={c.customer_phone} value={c.customer_phone}>
                  {c.customer_name}
                </option>
              ))}
            </datalist>
            {matchedCustomer && (
              <p
                data-testid="returning-customer-hint"
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {t("hint.returning")}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.deviceType")} *
            </Label>
            <Select value={form.device_type} onValueChange={setVal("device_type")}>
              <SelectTrigger data-testid="create-device-type-input" className="h-9">
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
              data-testid="create-serial-number-input"
              value={form.serial_number}
              onChange={setField("serial_number")}
              className="h-9"
              placeholder={t("ph.serialNumber")}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t("field.deviceName")} *
            </Label>
            <Input
              data-testid="create-device-input"
              value={form.device}
              onChange={setField("device")}
              className="h-9"
              placeholder={t("ph.deviceName")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.price")}
            </Label>
            <Input
              data-testid="create-estimate-input"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_estimate}
              onChange={setField("cost_estimate")}
              className="h-9 tabular"
              placeholder="0.00"
            />
          </div>
          {/* Optional accessories; just above description. */}
          <Collapsible className="rounded-md border sm:col-span-2">
            <CollapsibleTrigger
              data-testid="create-accessories-trigger"
              className="group flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium"
            >
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-left">{t("field.accessories")}</span>
              {form.accessories.length > 0 ? (
                <span className="tabular rounded-full bg-secondary px-2 py-0.5 text-[11px]">
                  {form.accessories.length}
                </span>
              ) : null}
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 border-t px-3 py-3">
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map((acc) => (
                  <label
                    key={acc}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm"
                  >
                    <Checkbox
                      data-testid={`create-accessory-${acc}`}
                      checked={form.accessories.includes(acc)}
                      onCheckedChange={() => toggleAccessory(acc)}
                    />
                    {t(`acc.${acc}`)}
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("acc.other")}
                </Label>
                <Input
                  data-testid="create-accessories-other-input"
                  value={form.accessories_other}
                  onChange={setField("accessories_other")}
                  className="h-9"
                  placeholder={t("ph.accessoriesOther")}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t("field.damageCategory")} *
            </Label>
            <Select
              value={form.damage_category}
              onValueChange={setVal("damage_category")}
            >
              <SelectTrigger data-testid="create-damage-category-select" className="h-9">
                <SelectValue placeholder={t("ph.damageCategory")} />
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

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t("field.damage")} *
            </Label>
            <Textarea
              data-testid="create-issue-textarea"
              value={form.issue_description}
              onChange={setField("issue_description")}
              className="min-h-[104px]"
              placeholder={t("ph.damage")}
            />
          </div>

          {/* Urgent toggle */}
          <div className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <Label className="text-sm font-medium">{t("field.urgent")}</Label>
            </div>
            <Switch
              data-testid="create-urgent-switch"
              checked={form.urgent}
              onCheckedChange={(v) => setForm((p) => ({ ...p, urgent: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-testid="create-ticket-cancel-button"
            onClick={() => onOpenChange(false)}
          >
            {t("create.cancel")}
          </Button>
          <Button
            data-testid="create-ticket-submit-button"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? t("create.creating") : t("create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
