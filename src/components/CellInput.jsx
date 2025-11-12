import React, { useState, useEffect, useRef } from "react";

export default function CellInput({ value, onChange, placeholder }) {
  const [localValue, setLocalValue] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = () => {
    onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(localValue);
      inputRef.current.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="cell-input"
    />
  );
}
