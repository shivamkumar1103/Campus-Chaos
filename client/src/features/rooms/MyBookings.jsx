import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import api from "@/utils/api";
import { Trash2, Clock, Calendar, AlertCircle, Loader2 } from "lucide-react";

export function MyBookings({ onBookingChanged }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/rooms/bookings/mine");
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch my bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/rooms/bookings/${id}`);
      fetchMyBookings();
      if (onBookingChanged) onBookingChanged();
    } catch (err) {
      alert("Failed to cancel booking: " + (err.response?.data?.message || err.message));
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-fg font-mono">
        <Loader2 className="size-5 animate-spin mr-2" />
        Loading your active bookings...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="brutal bg-card border border-border p-8 text-center rounded-md">
        <Calendar className="size-10 mx-auto text-muted-fg mb-3 opacity-50" />
        <h3 className="font-display font-extrabold text-lg text-ink uppercase">
          No Active Bookings Today
        </h3>
        <p className="text-muted-fg text-sm mt-1">
          You haven't booked any rooms for today yet. Use the availability grid to reserve a slot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <div
            key={booking._id}
            className="brutal bg-card border border-border p-5 rounded-md flex flex-col justify-between"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-display font-extrabold text-lg text-ink">
                  {booking.room?.name || "Room"}
                </h4>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-hyper/40 text-hyper bg-hyper/10">
                  {booking.kind === "cancel" ? "CANCELLED SLOT" : "ADHOC BOOKING"}
                </span>
              </div>

              <p className="text-muted-fg text-xs font-mono mb-3">
                {booking.room?.building || "Main Building"} · Floor {booking.room?.floor ?? "Ground"}
              </p>

              <div className="bg-black/5 dark:bg-white/5 p-3 rounded space-y-1.5 text-xs font-mono mb-4">
                <div className="flex items-center gap-2 text-ink">
                  <Clock className="size-3.5 text-muted-fg" />
                  <span>
                    {booking.start} — {booking.end} (Today)
                  </span>
                </div>
                {booking.purpose && (
                  <p className="text-muted-fg truncate">
                    Purpose: <span className="text-ink font-semibold">{booking.purpose}</span>
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => handleCancel(booking._id)}
              disabled={cancellingId === booking._id}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold font-display uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white"
            >
              {cancellingId === booking._id ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Cancelling...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" /> Cancel Booking
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
