import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ id, options, value, defaultValue, onChange, placeholder = "Selecione...", className = "", style = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : (defaultValue || ''));
  const selectRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setInternalValue(val);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: val, id } });
    }
  };

  const selectedOption = options.find(opt => String(opt.value) === String(internalValue));

  return (
    <div className={`custom-select-wrapper ${className}`} style={style} ref={selectRef}>
      {id && <input type="hidden" id={id} value={internalValue} />}
      
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`custom-select-icon ${isOpen ? 'open' : ''}`} style={{ flexShrink: 0, marginLeft: '8px' }} />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown animate-fade-in-up">
          <ul className="custom-select-options">
            {options.map((opt) => (
              <li 
                key={opt.value}
                className={`custom-select-option ${String(internalValue) === String(opt.value) ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))}
            {options.length === 0 && (
              <li className="custom-select-empty">Nenhuma opção</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
