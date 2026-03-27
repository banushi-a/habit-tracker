interface DragHandleProps {
  className?: string;
}

/**
 * A visual drag handle component that displays a 3x2 grid of dots
 * to indicate that an element can be dragged to reorder.
 */
export function DragHandle({ className = "" }: DragHandleProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110 hover:opacity-80 ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Drag to reorder"
      title="Drag to reorder habits"
    >
      <div className="grid grid-cols-2 gap-0.5 p-1">
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full transition-all duration-200"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.4)" }}
        />
      </div>
    </div>
  );
}