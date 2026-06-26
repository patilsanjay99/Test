import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface ComboboxOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface AutocompleteComboboxProps {
  options: ComboboxOption[];
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const AutocompleteCombobox: React.FC<AutocompleteComboboxProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Search and select...",
  className = "",
  required = false,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort options alphabetically by default
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) =>
      String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base', numeric: true })
    );
  }, [options]);

  // Sync search text with the selected option label on value or options change
  useEffect(() => {
    const selectedOption = sortedOptions.find(opt => String(opt.value) === String(value));
    if (selectedOption) {
      setSearch(selectedOption.label);
    } else if (value === '' || value === undefined || value === null) {
      setSearch('');
    }
  }, [value, sortedOptions]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search to match selected option if closed without selecting
        const selectedOption = sortedOptions.find(opt => String(opt.value) === String(value));
        if (selectedOption) {
          setSearch(selectedOption.label);
        } else {
          setSearch('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, sortedOptions]);

  const filteredOptions = sortedOptions.filter(opt => {
    const q = search.toLowerCase();
    const l = (opt.label || '').toLowerCase();
    const s = opt.sublabel ? opt.sublabel.toLowerCase() : '';
    return l.includes(q) || s.includes(q) || String(opt.value).toLowerCase().includes(q);
  });

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          disabled={disabled}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.target.select();
              setIsOpen(true);
            }
          }}
          required={required && !value} // Only require input if no value is selected
          className={`w-full pl-3 pr-8 py-1.5 border border-[#8faad8] rounded text-sm bg-[#f4fbf4] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {search && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearch('');
                onChange('');
                setIsOpen(true);
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setIsOpen(!isOpen);
            }}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto z-50 py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 italic">No matches found</div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur from firing before selecting
                    onChange(String(opt.value));
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[10px] text-gray-400 font-normal mt-0.5">{opt.sublabel}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
