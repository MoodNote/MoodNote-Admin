import { useState, useEffect } from "react";
import "./ColorPicker.css";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E",
  "#10B981", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#FB7185", "#FDBA74",
  "#6B7280", "#9CA3AF", "#D1D5DB", "#4B5563", "#1F2937", "#000000",
];

const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexDraft, setHexDraft] = useState(value);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  const normalizedValue = value.toUpperCase();

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (v && !v.startsWith("#")) v = "#" + v;
    setHexDraft(v.toUpperCase());
    if (COLOR_REGEX.test(v)) onChange(v.toUpperCase());
  };

  const nativeValue =
    value && COLOR_REGEX.test(value) ? value.toLowerCase() : "#6b7280";

  return (
    <div className="color-picker">
      <div className="color-picker__grid">
        {PRESET_COLORS.map((color) => {
          const isSelected = normalizedValue === color.toUpperCase();
          return (
            <button
              key={color}
              type="button"
              className={`color-picker__swatch${isSelected ? " color-picker__swatch--selected" : ""}`}
              style={{ backgroundColor: color }}
              aria-label={color}
              aria-pressed={isSelected}
              onClick={() => onChange(color)}
              title={color}
            />
          );
        })}
      </div>

      <div className="color-picker__footer">
        <label className="color-picker__custom-btn" title="Choose custom color">
          Custom
          <input
            type="color"
            className="color-picker__native-input"
            value={nativeValue}
            onChange={handleCustomChange}
          />
        </label>

        <div className="color-picker__selected-row">
          <input
            type="text"
            className="color-picker__hex-input"
            value={hexDraft}
            onChange={handleHexInput}
            placeholder="#RRGGBB"
            maxLength={7}
            spellCheck={false}
          />
          {value && COLOR_REGEX.test(value) && (
            <span
              className="color-picker__preview"
              style={{ backgroundColor: value }}
              aria-hidden="true"
            />
          )}
          {value && (
            <button
              type="button"
              className="color-picker__clear-btn"
              onClick={() => onChange("")}
              title="Clear color"
              aria-label="Clear color"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
