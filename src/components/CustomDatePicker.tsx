import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, parseISO, isValid } from 'date-fns';

interface CustomDatePickerProps {
  value?: string; // controlled
  defaultValue?: string; // uncontrolled
  onChange?: (value: string) => void;
  className?: string;
  required?: boolean;
  name?: string; // needed for form submission if uncontrolled
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  defaultValue, 
  onChange, 
  className, 
  required,
  name
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const selectedDate = internalValue && isValid(parseISO(internalValue)) ? new Date(internalValue) : null;

  const handleChange = (date: Date | null) => {
    const formatted = date ? format(date, 'yyyy-MM-dd') : '';
    
    // If uncontrolled, update internal state
    if (value === undefined) {
      setInternalValue(formatted);
    }
    
    if (onChange) {
      onChange(formatted);
    }
  };

  return (
    <>
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        className={`px-3 py-1.5 border border-gray-300 rounded text-sm bg-white font-mono w-full ${className || ''}`}
        required={required}
        wrapperClassName="w-full"
      />
      {/* Hidden input to hold the value for form submission in uncontrolled mode */}
      {name && <input type="hidden" name={name} value={internalValue} />}
    </>
  );
};
