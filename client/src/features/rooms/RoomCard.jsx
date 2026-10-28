import { Button } from "@/components/ui";
import { useState } from "react";
import { Clock, Calendar, Check, X, ShieldAlert } from "lucide-react";

export function RoomCard({
  room,
  onBook,
  canBook,
  occupiedBy,
  canCancelCurrent,
  activeBookingId,
  activeTimetableId,
  onCancelBooking,
  onCancelTimetable,
}) {
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancelClick = async () => {
    if (!confirm(`Are you sure you want to cancel this booking/slot for ${room.name}?`)) return;
    setIsCanceling(true);
    try {
      if (activeBookingId && onCancelBooking) {
        await onCancelBooking(activeBookingId);
      } else if (activeTimetableId && onCancelTimetable) {
        await onCancelTimetable(activeTimetableId);
      }
    } finally {
      setIsCanceling(false);
    }
  };

  const floorLabel =
    room.floor === 0
      ? "Ground Floor"
      : room.floor === 1
      ? "1st Floor"
      : room.floor === 2
      ? "2nd Floor"
      : room.floor === 3
      ? "3rd Floor"
      : `Floor ${room.floor}`;

  return (
    <div
      className="brutal bg-card border border-border rounded-md p-5 text-sm flex flex-col justify-between transition-all duration-200 hover:shadow-brutal-active"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-extrabold text-lg text-ink truncate">
            {room.name}
          </h3>
          <span
            className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
              room.type === "lab"
                ? "border-hyper/40 text-hyper bg-hyper/10"
                : "border-border text-muted-fg bg-black/5"
            }`}
          >
            {room.type === "class" ? "CLASSROOM" : "LAB"}
          </span>
        </div>

        <p className="text-muted-fg text-xs font-mono mb-4">
          {room.building} · {floorLabel}
        </p>

        {/* Status Badge */}
        {canBook ? (
          <div className="brutal-acid soft border border-acid/40 text-acid bg-acid/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-acid animate-pulse"></span>
            FREE — Available Now
          </div>
        ) : (
          <div className="border border-hyper/40 text-hyper bg-hyper/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-hyper"></span>
              Occupied
            </div>
            {occupiedBy && (
              <span className="text-[10px] opacity-80 truncate font-mono normal-case">
                {occupiedBy}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-border flex items-center gap-2">
        {canBook ? (
          <Button
            variant="default"
            onClick={() => onBook(room)}
            className="w-full py-2 font-display font-bold uppercase tracking-wider text-xs"
          >
            Book Slot
          </Button>
        ) : canCancelCurrent ? (
          <Button
            variant="destructive"
            onClick={handleCancelClick}
            disabled={isCanceling}
            className="w-full py-2 font-display font-bold uppercase tracking-wider text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isCanceling ? "Cancelling..." : "Cancel Slot (Authorized)"}
          </Button>
        ) : (
          <div className="w-full py-2 text-center text-[11px] font-mono text-muted-fg bg-black/5 rounded">
            Slot in session
          </div>
        )}
      </div>
    </div>
  );
}