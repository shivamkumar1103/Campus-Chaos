import { Button } from "@/components/ui";
import { useState } from "react";
import { Clock, Calendar, Check, X, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function RoomCard({
  room,
  onBook,
  canBook,
  timeSlot,
  occupiedBy,
  canCancelCurrent,
  activeBookingId,
  activeTimetableId,
  onCancelBooking,
  onCancelTimetable,
}) {
  const { user: currentUser } = useAuth();
  const [isCanceling, setIsCanceling] = useState(false);

  const isAuditorium = room.type === "auditorium" || room.name.toLowerCase() === "auditorium";
  const isAdmin = currentUser?.role === "admin";

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
              isAuditorium
                ? "border-amber-500/50 text-amber-500 bg-amber-500/10"
                : room.type === "lab"
                ? "border-hyper/40 text-hyper bg-hyper/10"
                : "border-border text-muted-foreground bg-black/5 dark:bg-white/5"
            }`}
          >
            {isAuditorium ? "AUDITORIUM" : room.type === "class" ? "CLASSROOM" : "LAB"}
          </span>
        </div>

        <p className="text-muted-foreground text-xs font-mono mb-4">
          {room.building} · {floorLabel}
        </p>

        {/* Status Badge */}
        {canBook ? (
          <div className="border border-acid/50 text-acid bg-acid/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-acid animate-pulse"></span>
              <span>FREE {timeSlot ? `• ${timeSlot}` : "— Available Now"}</span>
            </div>
            {isAuditorium && (
              <span className="text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                Admin Booking
              </span>
            )}
          </div>
        ) : (
          <div className="border border-hyper/50 text-hyper bg-hyper/10 text-[11px] font-bold tracking-wide uppercase rounded p-2 mb-4 flex flex-col gap-0.5 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-hyper"></span>
              <span>Occupied {timeSlot ? `(${timeSlot})` : ""}</span>
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
          isAuditorium && !isAdmin ? (
            <div className="w-full py-2 text-center text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center gap-1.5">
              <ShieldAlert className="size-3.5" />
              <span>Admin Booking Only</span>
            </div>
          ) : (
            <Button
              variant="default"
              onClick={() => onBook(room)}
              className="w-full py-2 font-display font-bold uppercase tracking-wider text-xs"
            >
              Book Slot {timeSlot ? `(${timeSlot})` : ""}
            </Button>
          )
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