import { useState } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ACCESSORIES,
  DAMAGE_CATEGORIES,
  DEVICE_TYPES,
} from "@/lib/statusConfig";
import { useI18n } from "@/lib/i18n";

const blankItem = () => ({
  device_type: "",
  device: "",
  serial_number: "",
  damage_category: "",
  issue_description: "",
  cost_estimate: "",
  urgent: false,
  accessories: [],
  accessories_other: "",
});

export function AddTicketItemDialog({ open, onOpenChange, onAdd, saving }) {
  const { t } = useI18n();
  const [form, setForm] = useState(blankItem);
  const setField = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const setValue = (key) => (value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const reset = () => setForm(blankItem());
  const close = () => {
    reset();
    onOpenChange(false);
  };

  const toggleAccessory = (key) => {
    setForm((previous) => {
      const selected = previous.accessories.includes(key);
      if (key === "no_accessories") {
        return {
          ...previous,
          accessories: selected ? [] : ["no_accessories"],
        };
      }
      const withoutNone = previous.accessories.filter(
        (entry) => entry !== "no_accessories"
      );
      return {
        ...previous,
        accessories: selected
          ? withoutNone.filter((entry) => entry !== key)
          : [...withoutNone, key],
      };
    });
  };

  const submit = () => {
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
    onAdd(
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
      close
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-[46rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("items.addTitle")}</DialogTitle>
          <DialogDescription>{t("items.addDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.deviceType")} *
            </Label>
            <Select value={form.device_type} onValueChange={setValue("device_type")}>
              <SelectTrigger data-testid="add-item-device-type" className="h-9">
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
              data-testid="add-item-serial"
              value={form.serial_number}
              onChange={setField("serial_number")}
              className="h-9"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t("field.deviceName")} *
            </Label>
            <Input
              data-testid="add-item-device"
              value={form.device}
              onChange={setField("device")}
              className="h-9"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("field.price")}
            </Label>
            <Input
              data-testid="add-item-price"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_estimate}
              onChange={setField("cost_estimate")}
              className="h-9 tabular"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              {t("field.damageCategory")} *
            </Label>
            <Select
              value={form.damage_category}
              onValueChange={setValue("damage_category")}
            >
              <SelectTrigger data-testid="add-item-damage-category" className="h-9">
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
              data-testid="add-item-issue"
              value={form.issue_description}
              onChange={setField("issue_description")}
              className="min-h-[88px]"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              {t("field.accessories")}
            </Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {ACCESSORIES.map((accessory) => (
                <label key={accessory} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    data-testid={`add-item-accessory-${accessory}`}
                    checked={form.accessories.includes(accessory)}
                    onCheckedChange={() => toggleAccessory(accessory)}
                  />
                  {t(`acc.${accessory}`)}
                </label>
              ))}
              <Input
                value={form.accessories_other}
                onChange={setField("accessories_other")}
                placeholder={t("ph.accessoriesOther")}
                className="col-span-2 h-9"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 sm:col-span-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              {t("field.urgent")}
            </Label>
            <Switch
              checked={form.urgent}
              onCheckedChange={(urgent) =>
                setForm((previous) => ({ ...previous, urgent }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t("create.cancel")}
          </Button>
          <Button data-testid="add-item-submit" onClick={submit} disabled={saving}>
            {saving ? t("detail.saving") : t("items.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
