
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  showPlaceholderOnAll?: boolean;
  buttonClassName?: string;
  panelClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, placeholder, renderOption, showPlaceholderOnAll = false, buttonClassName = '', panelClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = (showPlaceholderOnAll && value === 'all') || !selectedOption ? placeholder : selectedOption.label;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        className={`w-full bg-light-card dark:bg-dark-input border border-light-border dark:border-dark-border rounded-md px-4 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-primary text-light-text-primary dark:text-dark-text-primary ${buttonClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <Icon name="chevron-down" className={`h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-10 mt-1 w-full bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border focus:outline-none ${panelClassName}`}>
          <ul
            className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
            role="listbox"
          >
            {options.map((option) => (
              <li
                key={option.value}
                className={`text-light-text-primary dark:text-dark-text-primary cursor-pointer select-none relative px-4 py-2 hover:bg-light-border dark:hover:bg-dark-border transition-colors duration-150 ${value === option.value ? 'bg-light-border dark:bg-dark-border' : ''}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={value === option.value}
              >
                {renderOption ? (
                  renderOption(option, value === option.value)
                ) : (
                  <span className={`block truncate ${value === option.value ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
