import { Search } from "lucide-react";

type SearchBoxProps = { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> };

/** GET form, so search works without client JS and the URL is shareable. */
export function SearchBox({ action, defaultValue, placeholder, hidden = {} }: SearchBoxProps) {
  return (
    <form action={action} role="search" className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <label htmlFor="search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-10 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-sm"
      />
      {Object.entries(hidden).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
    </form>
  );
}
