import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

async function writeToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Clipboard copy failed");
}

export function CopyableTicketCode({ code, className, testId }) {
  const { t } = useI18n();
  const displayCode = String(code).startsWith("#") ? String(code) : `#${code}`;

  const copyCode = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await writeToClipboard(displayCode);
      toast.success(t("toast.codeCopied", { code: displayCode }));
    } catch {
      toast.error(t("toast.failCopyCode"));
    }
  };

  return (
    <span
      data-testid={testId}
      onClick={copyCode}
      title={t("action.copyTicketCode")}
      className={cn(
        "group/code inline-flex cursor-copy items-center gap-1 rounded px-1 py-0.5 font-mono font-extrabold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span>{displayCode}</span>
      <Copy
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 opacity-35 transition-opacity group-hover/code:opacity-100"
      />
    </span>
  );
}
