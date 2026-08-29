import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileClock,
  FileText,
  Package,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { invoicesApi, ticketsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const COPY = {
  ka: {
    back: "CRM-ში დაბრუნება",
    menu: "ფინანსები",
    newInvoice: "ახალი ინვოისი",
    list: "ინვოისების სია",
    draft: "მონახაზი",
    issued: "გაცემული",
    paid: "გადახდილი",
    markIssued: "გაცემულად მონიშვნა",
    markPaid: "გადახდილად მონიშვნა",
    total: "ჯამური თანხა",
    builderTitle: "ინვოისის შექმნა",
    builderHint: "აირჩიეთ ტიკეტი და მოწყობილობები, რომლებიც ინვოისში უნდა შევიდეს.",
    ticket: "ტიკეტი",
    chooseTicket: "აირჩიეთ ტიკეტი",
    physical: "ფიზიკური პირი",
    legal: "იურიდიული პირი",
    phone: "ტელეფონი",
    taxId: "საიდენტიფიკაციო კოდი",
    items: "მოწყობილობები / მომსახურება",
    selectAll: "ყველას მონიშვნა",
    item: "ნივთი",
    itemsCount: "ნივთი",
    price: "ფასი",
    notes: "შენიშვნა",
    notesPlaceholder: "მაგ. ანგარიშსწორება საბანკო გადარიცხვით",
    saveDraft: "მონახაზის შენახვა",
    issueInvoice: "ინვოისის გამოწერა",
    preview: "ინვოისის ვიზუალი",
    invoice: "ინვოისი",
    seller: "მომწოდებელი",
    sellerName: "DataLab Georgia",
    entrepreneur: "მცირე მეწარმის მონაცემები დაემატება",
    bank: "ბანკის ანგარიში დაემატება",
    buyer: "მყიდველი",
    description: "დასახელება",
    quantity: "რ-ბა",
    unitPrice: "ერთ. ფასი",
    sum: "თანხა",
    subtotal: "ჯამი",
    payable: "გადასახდელი",
    currency: "ყველა თანხა მოცემულია ლარში (₾)",
    noItems: "ინვოისის სანახავად მონიშნეთ მინიმუმ ერთი მოწყობილობა.",
    databaseBacked: "ინვოისები ინახება ბაზაში და refresh-ის შემდეგაც რჩება.",
    searchPlaceholder: "ინვოისის ან ტიკეტის ძიება...",
    saved: "ინვოისის მონახაზი შენახულია",
    issuedToast: "ინვოისი გამოწერილია",
    updated: "ინვოისის სტატუსი განახლებულია",
    createError: "ინვოისის შენახვა ვერ მოხერხდა",
    updateError: "სტატუსის განახლება ვერ მოხერხდა",
    selectRequired: "მონიშნეთ მინიმუმ ერთი მოწყობილობა",
    descriptionRequired: "ყველა მონიშნულ ნივთს მიუთითეთ დასახელება",
    loadingTickets: "ტიკეტები იტვირთება...",
    ticketsError: "ტიკეტების ჩატვირთვა ვერ მოხერხდა.",
    noTickets: "ინვოისის შესაქმნელად ჯერ დაამატეთ ტიკეტი.",
    loadingInvoices: "ინვოისები იტვირთება...",
    invoicesError: "ინვოისების ჩატვირთვა ვერ მოხერხდა.",
    emptyInvoices: "ინვოისები ჯერ არ არის შექმნილი.",
    records: "ჩანაწერი",
    details: "ინვოისის დეტალები",
    internalNote: "შიდა შენიშვნა",
    noNote: "შენიშვნა არ არის",
    print: "PDF / ბეჭდვა",
  },
  en: {
    back: "Back to CRM",
    menu: "Finance",
    newInvoice: "New invoice",
    list: "Invoice list",
    draft: "Draft",
    issued: "Issued",
    paid: "Paid",
    markIssued: "Mark as issued",
    markPaid: "Mark as paid",
    total: "Total value",
    builderTitle: "Create invoice",
    builderHint: "Choose a ticket and the devices that should be included in the invoice.",
    ticket: "Ticket",
    chooseTicket: "Choose a ticket",
    physical: "Individual",
    legal: "Legal entity",
    phone: "Phone",
    taxId: "Tax ID",
    items: "Devices / services",
    selectAll: "Select all",
    item: "item",
    itemsCount: "items",
    price: "Price",
    notes: "Notes",
    notesPlaceholder: "e.g. Payment by bank transfer",
    saveDraft: "Save draft",
    issueInvoice: "Issue invoice",
    preview: "Invoice preview",
    invoice: "INVOICE",
    seller: "Supplier",
    sellerName: "DataLab Georgia",
    entrepreneur: "Small entrepreneur details will be added",
    bank: "Bank account details will be added",
    buyer: "Buyer",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    sum: "Amount",
    subtotal: "Subtotal",
    payable: "Amount due",
    currency: "All amounts are in Georgian Lari (₾)",
    noItems: "Select at least one device to preview the invoice.",
    databaseBacked: "Invoices are stored in the database and remain after refresh.",
    searchPlaceholder: "Search invoice or ticket...",
    saved: "Invoice draft saved",
    issuedToast: "Invoice issued",
    updated: "Invoice status updated",
    createError: "Could not save the invoice",
    updateError: "Could not update the status",
    selectRequired: "Select at least one device",
    descriptionRequired: "Add a description for every selected item",
    loadingTickets: "Loading tickets...",
    ticketsError: "Could not load tickets.",
    noTickets: "Create a ticket before creating an invoice.",
    loadingInvoices: "Loading invoices...",
    invoicesError: "Could not load invoices.",
    emptyInvoices: "No invoices have been created yet.",
    records: "records",
    details: "Invoice details",
    internalNote: "Internal note",
    noNote: "No note",
    print: "PDF / Print",
  },
};

const GEL = new Intl.NumberFormat("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function invoiceTicket(ticket) {
  const code = String(ticket.ticket_code || "");
  const sourceItems = Array.isArray(ticket.items) && ticket.items.length
    ? ticket.items
    : [{
        id: `${ticket.id}-1`,
        position: 1,
        device: ticket.device,
        issue_description: ticket.issue_description,
        cost_estimate: ticket.cost_estimate,
      }];
  return {
    id: ticket.id,
    code,
    customerType: ticket.customer_type || "physical",
    customerName: ticket.customer_type === "legal"
      ? (ticket.company_name || ticket.customer_name || "—")
      : (ticket.customer_name || "—"),
    phone: ticket.customer_phone || "",
    taxId: ticket.tax_id || "",
    items: sourceItems.map((item, index) => ({
      id: item.id || `${ticket.id}-${index + 1}`,
      displayCode: `${code}-${item.position || index + 1}`,
      position: item.position || index + 1,
      device: item.device || ticket.device || "—",
      service: item.issue_description || ticket.issue_description || "Data recovery",
      price: item.cost_estimate ?? ticket.cost_estimate ?? 0,
    })),
  };
}

function StatusPill({ status, c }) {
  const variants = {
    draft: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    issued: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  };
  return <Badge variant="outline" className={cn("font-semibold", variants[status])}>{c[status]}</Badge>;
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}><Icon className="h-5 w-5" /></div>
        <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function InvoiceDocument({ invoice, c }) {
  const lines = invoice?.lines || [];
  const total = invoice?.total_amount ?? lines.reduce((sum, line) => sum + Number(line.amount ?? line.unit_price ?? 0), 0);
  return (
    <div className="min-h-[760px] w-full overflow-hidden rounded-sm border bg-white text-slate-900 shadow-xl print:min-h-0 print:border-0 print:shadow-none">
      <div className="h-2 bg-slate-950" />
      <div className="p-7 sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white"><ReceiptText className="h-5 w-5" /></div><div><p className="text-lg font-black tracking-tight">DataLab Georgia</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Data Recovery</p></div></div>
          <div className="text-right"><h2 className="text-2xl font-black tracking-tight">{c.invoice}</h2><p className="mt-1 text-sm font-bold text-red-500">№ {invoice?.invoice_number || invoice?.ticket_code || "—"}</p></div>
        </div>
        <div className="mt-8 grid gap-6 border-y border-slate-200 py-5 sm:grid-cols-2">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.seller}</p><p className="mt-2 text-sm font-bold">{c.sellerName}</p><p className="mt-1 text-xs text-slate-500">{c.entrepreneur}</p><p className="mt-1 text-xs text-slate-500">{c.bank}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.buyer}</p><p className="mt-2 text-sm font-bold">{invoice?.customer_name || "—"}</p><p className="mt-1 text-xs text-slate-500">{invoice?.customer_type === "legal" ? `${c.taxId}: ${invoice?.tax_id || "—"}` : c.physical}</p><p className="mt-1 text-xs text-slate-500">{c.phone}: {invoice?.customer_phone || "—"}</p></div>
        </div>
        {lines.length ? (
          <div className="mt-7 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-white"><tr><th className="px-4 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">{c.description}</th><th className="px-3 py-3 text-center font-semibold">{c.quantity}</th><th className="px-3 py-3 text-right font-semibold">{c.unitPrice}</th><th className="px-4 py-3 text-right font-semibold">{c.sum}</th></tr></thead>
              <tbody>{lines.map((line, index) => <tr key={line.item_id || index} className="border-b border-slate-100 last:border-0"><td className="px-4 py-4 text-slate-400">{index + 1}</td><td className="px-3 py-4"><p className="font-bold">{line.description}</p><p className="mt-1 text-[11px] text-slate-500">{line.device}</p></td><td className="px-3 py-4 text-center">{line.quantity || 1}</td><td className="px-3 py-4 text-right">{GEL.format(Number(line.unit_price) || 0)} ₾</td><td className="px-4 py-4 text-right font-bold">{GEL.format(Number(line.amount ?? line.unit_price) || 0)} ₾</td></tr>)}</tbody>
            </table>
          </div>
        ) : <div className="mt-7 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">{c.noItems}</div>}
        <div className="mt-6 ml-auto w-full max-w-xs space-y-3"><div className="flex justify-between text-sm text-slate-500"><span>{c.subtotal}</span><span>{GEL.format(total)} ₾</span></div><Separator className="bg-slate-200" /><div className="flex items-end justify-between"><span className="text-sm font-bold">{c.payable}</span><span className="text-2xl font-black">{GEL.format(total)} ₾</span></div></div>
        <div className="mt-12 border-t border-slate-200 pt-5"><p className="text-[10px] text-slate-400">{c.currency}</p><p className="mt-1 text-[10px] text-slate-400">DataLab Georgia · datalabgeorgia.ge</p></div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();
  const c = COPY[lang] || COPY.ka;
  const [headerSearch, setHeaderSearch] = useState("");
  const [activeView, setActiveView] = useState("new");
  const [ticketId, setTicketId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [notes, setNotes] = useState("");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  const ticketsQuery = useQuery({ queryKey: ["tickets", "invoice-options"], queryFn: () => ticketsApi.list({}) });
  const invoicesQuery = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const ticketOptions = useMemo(() => (ticketsQuery.data || []).map(invoiceTicket), [ticketsQuery.data]);
  const selectedTicket = ticketOptions.find((ticket) => ticket.id === ticketId) || null;

  const initializeTicket = (ticket) => {
    if (!ticket) return;
    setTicketId(ticket.id);
    setSelectedItems(ticket.items.map((item) => item.id));
    setPrices((old) => ({ ...old, ...Object.fromEntries(ticket.items.map((item) => [item.id, old[item.id] ?? item.price])) }));
    setDescriptions((old) => ({ ...old, ...Object.fromEntries(ticket.items.map((item) => [item.id, old[item.id] ?? item.service])) }));
  };

  useEffect(() => {
    if (!ticketId && ticketOptions.length) initializeTicket(ticketOptions[0]);
  }, [ticketId, ticketOptions]);

  useEffect(() => {
    const clearPrint = () => setPrintInvoice(null);
    window.addEventListener("afterprint", clearPrint);
    return () => window.removeEventListener("afterprint", clearPrint);
  }, []);

  const chosenItems = selectedTicket?.items.filter((item) => selectedItems.includes(item.id)) || [];
  const total = chosenItems.reduce((sum, item) => sum + (Number(prices[item.id]) || 0), 0);
  const invoices = useMemo(() => invoicesQuery.data || [], [invoicesQuery.data]);
  const filteredInvoices = invoices.filter((invoice) => `${invoice.invoice_number} ${invoice.ticket_code} ${invoice.customer_name} ${invoice.note || ""}`.toLowerCase().includes(headerSearch.toLowerCase()));
  const summary = useMemo(() => ({
    draft: invoices.filter((invoice) => invoice.status === "draft").length,
    issued: invoices.filter((invoice) => invoice.status === "issued").length,
    paid: invoices.filter((invoice) => invoice.status === "paid").length,
    total: invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
  }), [invoices]);

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setExpandedInvoiceId(invoice.id);
      setNotes("");
      setActiveView("list");
      toast.success(invoice.status === "draft" ? c.saved : c.issuedToast);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || c.createError),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => invoicesApi.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success(c.updated); },
    onError: () => toast.error(c.updateError),
  });

  const toggleItem = (id, checked) => setSelectedItems((old) => checked ? [...new Set([...old, id])] : old.filter((itemId) => itemId !== id));
  const allSelected = Boolean(selectedTicket?.items.length) && selectedTicket.items.every((item) => selectedItems.includes(item.id));
  const saveInvoice = (status) => {
    if (!selectedTicket || !chosenItems.length) return toast.error(c.selectRequired);
    if (chosenItems.some((item) => !(descriptions[item.id] ?? item.service).trim())) return toast.error(c.descriptionRequired);
    createMutation.mutate({
      ticket_id: selectedTicket.id,
      lines: chosenItems.map((item) => ({ item_id: item.id, description: (descriptions[item.id] ?? item.service).trim(), unit_price: Number(prices[item.id]) || 0 })),
      note: notes.trim(),
      status,
    });
  };
  const previewInvoice = selectedTicket ? {
    invoice_number: selectedTicket.code,
    ticket_code: selectedTicket.code,
    customer_type: selectedTicket.customerType,
    customer_name: selectedTicket.customerName,
    customer_phone: selectedTicket.phone,
    tax_id: selectedTicket.taxId,
    lines: chosenItems.map((item) => ({ item_id: item.id, device: item.device, description: descriptions[item.id] ?? item.service, quantity: 1, unit_price: Number(prices[item.id]) || 0, amount: Number(prices[item.id]) || 0 })),
    total_amount: total,
  } : null;
  const startPrint = (invoice) => { setPrintInvoice(invoice); window.setTimeout(() => window.print(), 50); };

  return (
    <>
      {printInvoice ? <div className="hidden print:block"><InvoiceDocument invoice={printInvoice} c={c} /></div> : null}
      <div className="flex h-screen flex-col overflow-hidden bg-background print:hidden">
        <Topbar title={t("invoices.title")} search={headerSearch} onSearch={setHeaderSearch} onSearchSubmit={() => setActiveView("list")} onCreate={() => navigate("/", { state: { openCreate: true } })} />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="shrink-0 border-b bg-[hsl(var(--surface-1))] p-3 md:w-64 md:border-b-0 md:border-r">
            <button type="button" onClick={() => navigate("/")} className="mb-2 flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm font-semibold shadow-sm transition-colors hover:bg-secondary"><ArrowLeft className="h-4 w-4" />{c.back}</button>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.menu}</p>
            <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              <button type="button" onClick={() => setActiveView("new")} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors md:w-full", activeView === "new" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Plus className="h-4 w-4" />{c.newInvoice}</button>
              <button type="button" onClick={() => setActiveView("list")} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors md:w-full", activeView === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><ReceiptText className="h-4 w-4" />{c.list}</button>
            </nav>
            <div className="mt-5 hidden rounded-xl border bg-background p-3 md:block"><div className="flex items-center gap-2 text-xs font-semibold"><FileText className="h-4 w-4 text-primary" />{c.list}</div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{c.databaseBacked}</p></div>
          </aside>

          <main className="crm-scroll min-w-0 flex-1 overflow-auto bg-muted/20">
            <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={FileClock} label={c.draft} value={summary.draft} tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <SummaryCard icon={FileCheck2} label={c.issued} value={summary.issued} tone="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" />
                <SummaryCard icon={CheckCircle2} label={c.paid} value={summary.paid} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" />
                <SummaryCard icon={Banknote} label={c.total} value={`${GEL.format(summary.total)} ₾`} tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" />
              </section>

              {activeView === "list" ? (
                <Card className="overflow-hidden shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 border-b p-4"><div><h1 className="font-bold">{c.list}</h1><p className="text-xs text-muted-foreground">{filteredInvoices.length} {c.records}</p></div><div className="relative ml-auto w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={headerSearch} onChange={(event) => setHeaderSearch(event.target.value)} placeholder={c.searchPlaceholder} className="pl-9" /></div><Button className="gap-2" onClick={() => setActiveView("new")}><Plus className="h-4 w-4" />{c.newInvoice}</Button></div>
                  {invoicesQuery.isLoading ? <p className="p-8 text-center text-sm text-muted-foreground">{c.loadingInvoices}</p> : invoicesQuery.isError ? <p className="p-8 text-center text-sm text-destructive">{c.invoicesError}</p> : filteredInvoices.length ? (
                    <div className="divide-y">{filteredInvoices.map((invoice) => {
                      const expanded = expandedInvoiceId === invoice.id;
                      return <article key={invoice.id}>
                        <button type="button" aria-expanded={expanded} onClick={() => setExpandedInvoiceId(expanded ? null : invoice.id)} className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><ReceiptText className="h-5 w-5" /></div>
                          <div className="min-w-0 flex-1"><p className="font-bold">№ {invoice.invoice_number}</p><p className="truncate text-xs text-muted-foreground">#{invoice.ticket_code} · {invoice.customer_name}</p>{invoice.note ? <p className="mt-1 truncate text-xs font-medium text-amber-700 dark:text-amber-400">{c.notes}: {invoice.note}</p> : null}</div>
                          <StatusPill status={invoice.status} c={c} /><p className="w-28 text-right font-bold tabular-nums">{GEL.format(invoice.total_amount)} ₾</p><ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
                        </button>
                        {expanded ? <div className="border-t bg-muted/20 p-4 md:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{c.details}</h2><p className="text-xs text-muted-foreground">{invoice.lines.length} {c.itemsCount}</p></div><div className="flex flex-wrap gap-2">{invoice.status === "draft" ? <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: invoice.id, status: "issued" })}>{c.markIssued}</Button> : null}{invoice.status !== "paid" ? <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: invoice.id, status: "paid" })}>{c.markPaid}</Button> : null}<Button size="sm" className="gap-2" onClick={() => startPrint(invoice)}><Printer className="h-4 w-4" />{c.print}</Button></div></div><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><InvoiceDocument invoice={invoice} c={c} /><Card><CardContent className="p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">{c.internalNote}</p><p className="mt-2 whitespace-pre-wrap text-sm">{invoice.note || c.noNote}</p></CardContent></Card></div></div> : null}
                      </article>;
                    })}</div>
                  ) : <p className="p-8 text-center text-sm text-muted-foreground">{c.emptyInvoices}</p>}
                </Card>
              ) : (
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(520px,0.9fr)_minmax(600px,1.1fr)]">
                  <Card className="shadow-sm"><div className="border-b p-5"><h1 className="text-lg font-bold">{c.builderTitle}</h1><p className="mt-1 text-sm text-muted-foreground">{c.builderHint}</p></div><CardContent className="space-y-5 p-5">
                    {ticketsQuery.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">{c.loadingTickets}</p> : ticketsQuery.isError ? <p className="py-8 text-center text-sm text-destructive">{c.ticketsError}</p> : !selectedTicket ? <p className="py-8 text-center text-sm text-muted-foreground">{c.noTickets}</p> : <>
                      <div className="space-y-2"><Label>{c.ticket}</Label><Select value={ticketId} onValueChange={(value) => initializeTicket(ticketOptions.find((entry) => entry.id === value))}><SelectTrigger className="h-11"><SelectValue placeholder={c.chooseTicket} /></SelectTrigger><SelectContent>{ticketOptions.map((ticket) => <SelectItem key={ticket.id} value={ticket.id}>#{ticket.code} — {ticket.customerName} · {ticket.items.length} {c.item}</SelectItem>)}</SelectContent></Select></div>
                      <div className="rounded-xl border bg-muted/25 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm">{selectedTicket.customerType === "legal" ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{selectedTicket.customerName}</p><Badge variant="outline">{selectedTicket.customerType === "legal" ? c.legal : c.physical}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{c.phone}: {selectedTicket.phone}</p>{selectedTicket.taxId ? <p className="mt-1 text-xs text-muted-foreground">{c.taxId}: {selectedTicket.taxId}</p> : null}</div></div></div>
                      <div className="space-y-3"><div className="flex items-center justify-between gap-3"><Label>{c.items}</Label><label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground"><Checkbox checked={allSelected} onCheckedChange={(checked) => setSelectedItems(checked ? selectedTicket.items.map((item) => item.id) : [])} />{c.selectAll}</label></div>{selectedTicket.items.map((item) => { const checked = selectedItems.includes(item.id); return <div key={item.id} className={cn("rounded-xl border p-4 transition-colors", checked ? "border-primary/40 bg-primary/[0.03]" : "bg-muted/20 opacity-70")}><div className="flex items-start gap-3"><Checkbox className="mt-1" checked={checked} onCheckedChange={(value) => toggleItem(item.id, Boolean(value))} /><Package className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.device}</p><Badge variant="secondary">#{item.displayCode}</Badge></div><div className="space-y-1"><Label htmlFor={`invoice-description-${item.id}`} className="text-[11px] text-muted-foreground">{c.description}</Label><Input id={`invoice-description-${item.id}`} disabled={!checked} value={descriptions[item.id] ?? item.service} onChange={(event) => setDescriptions((old) => ({ ...old, [item.id]: event.target.value }))} className="h-9" /></div></div><div className="w-32 shrink-0"><Label className="sr-only">{c.price}</Label><div className="relative"><Input type="number" min="0" step="0.01" disabled={!checked} value={prices[item.id] ?? 0} onChange={(event) => setPrices((old) => ({ ...old, [item.id]: event.target.value }))} className="pr-8 text-right font-semibold" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₾</span></div></div></div></div>; })}</div>
                      <div className="space-y-2"><Label htmlFor="invoice-notes">{c.notes}</Label><Input id="invoice-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={c.notesPlaceholder} /></div><Separator /><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" className="gap-2" disabled={createMutation.isPending} onClick={() => saveInvoice("draft")}><Save className="h-4 w-4" />{c.saveDraft}</Button><Button className="gap-2" disabled={createMutation.isPending} onClick={() => saveInvoice("issued")}><ReceiptText className="h-4 w-4" />{c.issueInvoice}</Button></div>
                    </>}
                  </CardContent></Card>
                  <div className="space-y-3 xl:sticky xl:top-5"><div className="flex items-center justify-between"><h2 className="font-bold">{c.preview}</h2><Button variant="outline" size="sm" className="gap-2" disabled={!previewInvoice?.lines.length} onClick={() => startPrint(previewInvoice)}><Printer className="h-4 w-4" />{c.print}</Button></div><InvoiceDocument invoice={previewInvoice} c={c} /></div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
