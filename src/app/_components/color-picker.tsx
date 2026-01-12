"use client";

import { useState } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PASTEL_COLORS = [
  "#FFB3BA", // Light Pink
  "#FFDFBA", // Light Peach
  "#FFFFBA", // Light Yellow
  "#BAFFC9", // Light Mint
  "#BAE1FF", // Light Blue
  "#C9C9FF", // Light Lavender
  "#FFB3E6", // Light Rose
  "#E0BBE4", // Light Purple
];

/**
 * Color picker component with predefined pastel colors and custom color option.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Predefined Colors */}
      <div className="grid grid-cols-8 gap-2">
        {PASTEL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color);
              setShowCustomPicker(false);
            }}
            className="h-10 w-10 rounded-full border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? "hsl(var(--foreground))" : "transparent",
            }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Custom Color Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="rounded px-3 py-2 text-sm transition-all duration-300"
          style={{
            backgroundColor: "hsl(var(--button-bg))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
          }}
        >
          {showCustomPicker ? "Hide" : "Custom Color"}
        </button>

        {showCustomPicker && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border-2"
              style={{ borderColor: "hsl(var(--button-bg))" }}
            />
            <span className="text-sm" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
              {value.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
