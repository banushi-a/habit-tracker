"use client";

import { useState } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PALETTE = [
  { hex: "#c44b3b", label: "Rust" },
  { hex: "#c9834c", label: "Ochre" },
  { hex: "#c9a84c", label: "Amber" },
  { hex: "#7a9e7e", label: "Sage" },
  { hex: "#4a8b8b", label: "Teal" },
  { hex: "#6b87a8", label: "Blue" },
  { hex: "#8c6b8a", label: "Plum" },
  { hex: "#b8694e", label: "Terra" },
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map(({ hex, label }) => {
          const isSelected = value.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => {
                onChange(hex);
                setShowCustom(false);
              }}
              title={label}
              className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: hex,
                boxShadow: isSelected
                  ? `0 0 0 2px var(--bg), 0 0 0 4px ${hex}`
                  : "none",
              }}
              aria-label={`Select ${label}`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--fg-muted)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--btn-hover)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--btn)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          {showCustom ? "Hide custom" : "Custom color"}
        </button>

        {showCustom && (
          <div className="flex items-center gap-2">
            <div
              className="relative h-7 w-7 overflow-hidden rounded-full"
              style={{ border: "2px solid var(--border)" }}
            >
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer scale-150 opacity-0"
                style={{ opacity: 0 }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: value }}
              />
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span
              className="font-mono text-xs tracking-wider uppercase"
              style={{ color: "var(--fg-muted)" }}
            >
              {value.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
