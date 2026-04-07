interface DragHandleProps {
  className?: string;
}

export function DragHandle({ className = "" }: DragHandleProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-opacity duration-200 hover:opacity-100 ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Drag to reorder"
      title="Drag to reorder habits"
      style={{ opacity: 0.35 }}
    >
      <div className="flex flex-col gap-[3px] p-1">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-[3px]">
            {[0, 1].map((col) => (
              <div
                key={col}
                className="rounded-full"
                style={{
                  width: "3px",
                  height: "3px",
                  backgroundColor: "var(--fg)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
