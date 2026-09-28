import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { filterOwnershipDesignationSearchOptions } from "@workspace/constants";

export type OwnershipDesignationOption = {
  value: string;
  label: string;
};

type Props = {
  options: readonly OwnershipDesignationOption[];
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  helperText?: string;
  maxSelections?: number;
  id?: string;
};

/**
 * A bounded, searchable designation selector. It deliberately accepts only
 * canonical options provided by the caller — it never turns typed text into a
 * new ownership label or infers a designation.
 */
export function OwnershipDesignationCombobox({
  options,
  values,
  onChange,
  label = "Ownership designations",
  helperText = "Type a few letters, then choose documented designations that apply.",
  maxSelections = 10,
  id = "ownership-designations",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const suggestions = useMemo(() => {
    const available = options.filter((option) => !values.includes(option.value));
    if (!normalizedQuery) return available.slice(0, 8);
    return filterOwnershipDesignationSearchOptions(available, normalizedQuery).slice(0, 12);
  }, [normalizedQuery, options, values]);

  function select(value: string) {
    if (values.includes(value)) return;
    if (values.length >= maxSelections) return;
    onChange([...values, value]);
    setQuery("");
    setOpen(false);
  }

  function remove(value: string) {
    onChange(values.filter((selected) => selected !== value));
  }

  const selectedOptions = values
    .map((value) => options.find((option) => option.value === value) ?? { value, label: value });

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">{label}</label>
      <p className="text-xs leading-5 text-[#3A1F0E]/55">{helperText}</p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A1F0E]/45" />
        <input
          id={id}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && suggestions.length === 1) {
              event.preventDefault();
              select(suggestions[0].value);
            }
          }}
          placeholder="Start typing: Black, Hispanic, Ethiopian…"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-suggestions`}
          className="w-full rounded-xl border border-[#3A1F0E]/20 bg-white py-2.5 pl-10 pr-10 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/45 focus:border-[#CA922B] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/20"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A1F0E]/45" />
        {open && (
          <div id={`${id}-suggestions`} role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#3A1F0E]/15 bg-white p-1 shadow-xl">
            {suggestions.length > 0 ? suggestions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option.value)}
                disabled={values.length >= maxSelections}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#2B1507] hover:bg-[#CA922B]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option.label}
                <span className="text-xs text-[#3A1F0E]/45">Add</span>
              </button>
            )) : (
              <p className="px-3 py-2.5 text-sm text-[#3A1F0E]/55">No approved designation matches that text.</p>
            )}
          </div>
        )}
      </div>
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected ownership designations">
          {selectedOptions.map((option) => (
            <span key={option.value} className="inline-flex items-center gap-1.5 rounded-full border border-[#CA922B]/30 bg-[#CA922B]/10 px-3 py-1.5 text-xs font-bold text-[#2B1507]">
              <Check className="h-3 w-3 text-[#A66B13]" />
              {option.label}
              <button type="button" onClick={() => remove(option.value)} aria-label={`Remove ${option.label}`} className="rounded-full p-0.5 text-[#3A1F0E]/55 hover:bg-[#3A1F0E]/10 hover:text-[#2B1507]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs font-medium text-[#3A1F0E]/50">{values.length}/{maxSelections} selected</p>
    </div>
  );
}
