import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import api from "@/utils/api";
import { Loader2, Clock, CheckCircle2, Sparkles, Building2 } from "lucide-react";

const QUICK_PURPOSES = [
  "Extra Lecture",
  "Lab Practical",
  "Internal Test / Exam",
  "Doubt Clearing",
  "Project Review",
  "Club Meeting",
];

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${mins} mins`;
};

export function BookModal({
  isOpen,
  onClose,
  room,
  onSuccess,
  defaultStart = "10:00",
  defaultEnd = "11:00",
}) {
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPurpose("");
      setError("");
    }
  }, [isOpen, defaultStart, defaultEnd]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!defaultStart || !defaultEnd) {
      setError("Please select a time slot from the room filters first.");
      return;
    }

    if (!purpose.trim()) {
      setError("Please enter or select a purpose / subject.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/rooms/book", {
        roomId: room._id,
        start: defaultStart,
        end: defaultEnd,
        purpose: purpose.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to book room"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="brutal-lg max-w-md w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl uppercase text-foreground">
              Book Room {room.name}
            </h2>
            <p className="text-muted-foreground text-xs mt-1 font-mono flex items-center gap-1.5">
              <Building2 className="size-3.5 text-acid" />
              {room.building} · {room.floor === -1 ? "Underground Level" : `Floor ${room.floor === 0 ? "Ground" : room.floor}`} ·{" "}
              {room.type === "auditorium"
                ? "Auditorium"
                : room.type === "class"
                ? "Classroom"
                : "Laboratory"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Confirmed Time Slot Display (Selected from outside filter) */}
          <div className="bg-paper dark:bg-void p-3.5 border-2 border-acid/60 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase block">
                  Confirmed Time Slot (Today)
                </span>
                <span className="font-display font-black text-lg text-foreground">
                  {formatTime(defaultStart)} — {formatTime(defaultEnd)}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-acid text-obsidian rounded uppercase shadow-sm">
                {calculateDuration(defaultStart, defaultEnd)}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 pt-1.5 border-t border-border/40">
              <Clock className="size-3 text-acid shrink-0" />
              <span>Time slot is configured directly from your active room search.</span>
            </div>
          </div>

          {/* Purpose / Subject with 1-click Quick Presets */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-foreground opacity-90">
              Purpose / Subject Title *
            </label>
            <Input
              placeholder="e.g., Extra Lecture, DBMS Lab, Seminar, Class Test"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              autoFocus
              className="text-xs font-mono"
            />

            {/* Quick Presets */}
            <div className="mt-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1.5">
                <Sparkles className="size-3 text-acid" /> Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PURPOSES.map((p) => {
                  const isSelected = purpose === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurpose(p)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-acid text-obsidian border-acid shadow-sm"
                          : "bg-paper dark:bg-void text-muted-foreground border-border hover:text-foreground hover:border-acid"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-hyper/10 border border-hyper text-hyper text-xs font-mono font-semibold rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3 pt-3 border-t border-border">
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Confirming...
                </>
              ) : (
                `Confirm Booking (${defaultStart} - ${defaultEnd})`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
