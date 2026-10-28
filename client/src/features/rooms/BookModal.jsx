import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import api from "@/utils/api";
import { Loader2 } from "lucide-react";

const TIME_OPTIONS = [
  { value: "08:00", label: "08:00 AM" },
  { value: "08:30", label: "08:30 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "17:30", label: "05:30 PM" },
  { value: "18:00", label: "06:00 PM" },
];

export function BookModal({
  isOpen,
  onClose,
  room,
  onSuccess,
  defaultStart = "10:00",
  defaultEnd = "11:00",
}) {
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setPurpose("");
      setError("");
    }
  }, [isOpen, defaultStart, defaultEnd]);

  if (!isOpen || !room) return null;

  const handleStartChange = (newStart) => {
    setStartTime(newStart);
    if (endTime <= newStart) {
      const idx = TIME_OPTIONS.findIndex((t) => t.value === newStart);
      const nextIdx = Math.min(idx + 2, TIME_OPTIONS.length - 1);
      setEndTime(TIME_OPTIONS[nextIdx].value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError("Start and end times are required.");
      return;
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMins = startH * 60 + (startM || 0);
    const endMins = endH * 60 + (endM || 0);

    if (endH > 18 || (endH === 18 && endM > 0)) {
      setError("Booking cannot be past 6:00 PM.");
      return;
    }
    if (endMins <= startMins) {
      setError("End time must be after start time.");
      return;
    }
    if (endMins - startMins > 240) {
      setError("Booking duration cannot exceed 4 hours.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/rooms/book", {
        roomId: room._id,
        start: startTime,
        end: endTime,
        purpose: purpose.trim() || "Adhoc Class / Meeting",
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

  const availableEndOptions = TIME_OPTIONS.filter((t) => t.value > startTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="brutal-lg max-w-md w-full bg-card p-6 shadow-2xl relative"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl uppercase text-ink">
              Book Room {room.name}
            </h2>
            <p className="text-muted-fg text-xs mt-1 font-mono">
              {room.building} · Floor {room.floor === 0 ? "Ground" : room.floor} ·{" "}
              {room.type === "class" ? "Classroom" : "Laboratory"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-ink opacity-60 hover:opacity-100 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1 text-ink">
              Purpose / Subject
            </label>
            <Input
              placeholder="e.g., Extra Lecture, Practical, Seminar"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1 text-ink">
                Start Time (30m)
              </label>
              <select
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="brutal w-full py-2 px-3 text-xs font-mono font-semibold text-ink bg-card border border-border rounded"
              >
                {TIME_OPTIONS.slice(0, -1).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1 text-ink">
                End Time (30m)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="brutal w-full py-2 px-3 text-xs font-mono font-semibold text-ink bg-card border border-border rounded"
              >
                {availableEndOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] font-mono text-muted-fg">
            Date forced to today (IST). Max duration 4 hours, up to 6:00 PM.
          </p>

          {error && (
            <div className="p-2.5 bg-hyper/10 border border-hyper text-hyper text-xs font-mono font-semibold rounded">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-3 pt-3 border-t border-border">
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Booking...
                </>
              ) : (
                "Confirm Booking"
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