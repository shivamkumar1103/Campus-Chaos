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
      className="brutal bg-card border-border rounded-md p-5 text-sm flex flex-col justify-between transition-all duration-200 hover:shadow-brutal-active text-foreground"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-extrabold text-lg text-foreground truncate">
            {room.name}
          </h3>
          <span
            className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
              room.type === "lab"
                ? "border-hyper/40 text-hyper bg-hyper/10"
                : "border-border text-muted-foreground bg-black/5 dark:bg-white/5"
            }`}
          >
            {room.type === "class" ? "CLASSROOM" : "LAB"}
          </span>
        </div>

        <p className="text-muted-foreground text-xs font-mono mb-4">
          {room.building} · {floorLabel}
        </p>

        {/* Status Badge */}
        {canBook ? (
          <div className="border border-acid/50 text-acid bg-acid/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex items-center gap-1.5 font-mono">
            <span className="inline-block size-2 rounded-full bg-acid animate-pulse"></span>
            FREE — Available Now
          </div>
        ) : (
          <div className="border border-hyper/50 text-hyper bg-hyper/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex flex-col gap-0.5 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-hyper"></span>
              Occupied
            </div>
            {occupiedBy && (
              <span className="text-[10px] opacity-90 truncate font-mono normal-case text-foreground">
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
          <div className="w-full py-2 text-center text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 rounded border border-border/50">
            Slot in session
          </div>
        )}
      </div>
    </div>
  );
}