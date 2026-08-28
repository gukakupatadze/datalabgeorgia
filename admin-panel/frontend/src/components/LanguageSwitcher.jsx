import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  const Option = ({ value, label }) => (
    <button
      type="button"
      data-testid={`lang-option-${value}`}
      onClick={() => setLang(value)}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-colors",
        lang === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      data-testid="language-switcher"
      className="flex items-center gap-1 rounded-md border bg-secondary/60 p-0.5"
    >
      <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      <Option value="ka" label="ქარ" />
      <Option value="en" label="EN" />
    </div>
  );
}
