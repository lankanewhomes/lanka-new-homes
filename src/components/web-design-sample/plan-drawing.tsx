import type { SamplePlanRoom } from "./sample-data";

// A simple, abstract floor-plan sketch (rooms as outlined boxes) for the sample
// residences — deliberately schematic, not a real architectural drawing.
export function PlanDrawing({ rooms, label }: { rooms: SamplePlanRoom[]; label: string }) {
  return (
    <svg viewBox="0 0 300 190" role="img" aria-label={label} className="smp-plan-svg">
      <rect x="6" y="6" width="288" height="178" rx="2" className="smp-plan-outline" />
      {rooms.map((room) => (
        <g key={room.label}>
          <rect x={room.x} y={room.y} width={room.w} height={room.h} className="smp-plan-room" />
          <text x={room.x + room.w / 2} y={room.y + room.h / 2} textAnchor="middle" dominantBaseline="middle" className="smp-plan-label">
            {room.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
