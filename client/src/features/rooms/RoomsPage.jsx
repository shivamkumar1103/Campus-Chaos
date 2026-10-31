import { useState, useEffect, useCallback } from "react";
import { Button, Label } from "@/components/ui";
import { RoomCard } from "./RoomCard";
import { BookModal } from "./BookModal";
import { MyBookings } from "./MyBookings";
import api from "@/utils/api";
import {
  Calendar,
  Clock,
  Building,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// Standard 30-minute intervals between 08:00 and 18:00
export const TIME_OPTIONS = [
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

const PERIOD_PRESETS = [
  { label: "Slot 1 (9-10)", start: "09:00", end: "10:00" },
  { label: "Slot 2 (10-11)", start: "10:00", end: "11:00" },
  { label: "Slot 3 (11:30-12:30)", start: "11:30", end: "12:30" },
  { label: "Slot 4 (12:30-1:30)", start: "12:30", end: "13:30" },
  { label: "Slot 5 (2:30-3:30)", start: "14:30", end: "15:30" },
  { label: "Slot 6 (3:30-4:30)", start: "15:30", end: "16:30" },
];

export function RoomsPage() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mine'

  // Round time to nearest half hour within 08:00-18:00; default to 10:00-11:00 if outside college hours
  const getInitialTimes = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    if (h < 8 || h >= 18) {
      return { start: "10:00", end: "11:00" };
    }

    const roundedM = m < 30 ? "00" : "30";
    const startHourStr = String(h).padStart(2, "0");
    const start = `${startHourStr}:${roundedM}`;

    // Find index in TIME_OPTIONS, then pick +2 (1 hr later)
    const startIndex = TIME_OPTIONS.findIndex((t) => t.value === start);
    const endIndex = Math.min(
      startIndex !== -1 ? startIndex + 2 : 4,
      TIME_OPTIONS.length - 1
    );
    const end = TIME_OPTIONS[endIndex].value;

    return { start, end };
  };

  const initialTimes = getInitialTimes();

  const [filters, setFilters] = useState({
    block: "Main Building",
    floor: "",
    type: "",
    start: initialTimes.start,
    end: initialTimes.end,
  });

  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchAvailability = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await api.get("/rooms/available", {
          params: {
            block: filters.block,
            floor: filters.floor !== "" ? filters.floor : undefined,
            type: filters.type || undefined,
            start: filters.start || undefined,
            end: filters.end || undefined,
          },
        });
        setAvailability(res.data);
      } catch (err) {
        console.error("Failed to fetch availability", err);
        setMessage({
          type: "error",
          text:
            "Could not load rooms. " +
            (err.response?.data?.message || err.message),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Poll every 30 seconds for live timetable/booking updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAvailability(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchAvailability]);

  // When user selects a start time, ensure end time is at least 30 mins after
  const handleStartChange = (newStart) => {
    setFilters((prev) => {
      let newEnd = prev.end;
      if (newEnd <= newStart) {
        const startIndex = TIME_OPTIONS.findIndex((t) => t.value === newStart);
        const nextIndex = Math.min(startIndex + 2, TIME_OPTIONS.length - 1);
        newEnd = TIME_OPTIONS[nextIndex].value;
      }
      return { ...prev, start: newStart, end: newEnd };
    });
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.delete(`/rooms/bookings/${bookingId}`);
      setMessage({ type: "success", text: "Booking cancelled successfully!" });
      fetchAvailability(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to cancel: " + (err.response?.data?.message || err.message),
      });
    }
  };

  const handleCancelTimetable = async (timetableId) => {
    try {
      await api.post("/rooms/cancel-slot", { timetableId });
      setMessage({
        type: "success",
        text: "Timetable slot cancelled for today!",
      });
      fetchAvailability(true);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          "Failed to cancel slot: " + (err.response?.data?.message || err.message),
      });
    }
  };

  const freeRooms = availability.filter((r) => r.status === "free");
  const occupiedRooms = availability.filter((r) => r.status === "occupied");

  // Options available for End Time (must be strictly greater than start time)
  const availableEndOptions = TIME_OPTIONS.filter(
    (t) => t.value > filters.start
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal bg-card p-6 border-border rounded-md text-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-acid animate-pulse"></span>
              <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase text-foreground">
                Campus Room Availability
              </h1>
            </div>
            <p className="mt-1 text-muted-foreground text-xs font-mono">
              Main Building · Live availability & timetable overrides for today (
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              )
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAvailability(true)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 text-xs font-mono font-bold"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {/* Tab switch */}
            <div className="flex border-2 border-border rounded overflow-hidden">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-bold font-display uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-ink text-cream dark:bg-acid dark:text-obsidian"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                All Rooms ({availability.length})
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`px-3 py-1.5 text-xs font-bold font-display uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "mine"
                    ? "bg-ink text-cream dark:bg-acid dark:text-obsidian"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-xs font-mono font-bold flex items-center justify-between ${
            message.type === "success"
              ? "bg-acid/20 text-acid border border-acid"
              : "bg-hyper/20 text-hyper border border-hyper"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {activeTab === "mine" ? (
        <MyBookings onBookingChanged={() => fetchAvailability(true)} />
      ) : (
        <>
          {/* Filters Section */}
          <section className="brutal p-5 bg-card border-border rounded-md space-y-4 text-foreground">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Building */}
              <div>
                <Label className="block text-xs font-mono font-bold uppercase text-foreground mb-1.5 opacity-90">
                  Building
                </Label>
                <select
                  value={filters.block}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, block: e.target.value }))
                  }
                  className="brutal-flat w-full h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer hover:bg-sun/20 dark:hover:bg-grape transition-colors"
                >
                  <option value="Main Building" className="bg-paper text-ink dark:bg-void dark:text-cream">Main Building</option>
                </select>
              </div>

              {/* Floor */}
              <div>
                <Label className="block text-xs font-mono font-bold uppercase text-foreground mb-1.5 opacity-90">
                  Floor
                </Label>
                <select
                  value={filters.floor}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, floor: e.target.value }))
                  }
                  className="brutal-flat w-full h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer hover:bg-sun/20 dark:hover:bg-grape transition-colors"
                >
                  <option value="" className="bg-paper text-ink dark:bg-void dark:text-cream">All Floors (0–3)</option>
                  <option value="0" className="bg-paper text-ink dark:bg-void dark:text-cream">Ground Floor (101-109, MB, Labs)</option>
                  <option value="1" className="bg-paper text-ink dark:bg-void dark:text-cream">1st Floor (201-209)</option>
                  <option value="2" className="bg-paper text-ink dark:bg-void dark:text-cream">2nd Floor (301-310)</option>
                  <option value="3" className="bg-paper text-ink dark:bg-void dark:text-cream">3rd Floor (401-410)</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <Label className="block text-xs font-mono font-bold uppercase text-foreground mb-1.5 opacity-90">
                  Room Type
                </Label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, type: e.target.value }))
                  }
                  className="brutal-flat w-full h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer hover:bg-sun/20 dark:hover:bg-grape transition-colors"
                >
                  <option value="" className="bg-paper text-ink dark:bg-void dark:text-cream">All Types (Class & Lab)</option>
                  <option value="class" className="bg-paper text-ink dark:bg-void dark:text-cream">Classroom Only</option>
                  <option value="lab" className="bg-paper text-ink dark:bg-void dark:text-cream">Laboratory Only</option>
                </select>
              </div>

              {/* Start Time (Half-hour steps) */}
              <div>
                <Label className="block text-xs font-mono font-bold uppercase text-foreground mb-1.5 opacity-90">
                  Start Time (30m)
                </Label>
                <select
                  value={filters.start}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="brutal-flat w-full h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer hover:bg-sun/20 dark:hover:bg-grape transition-colors"
                >
                  {TIME_OPTIONS.slice(0, -1).map((t) => (
                    <option key={t.value} value={t.value} className="bg-paper text-ink dark:bg-void dark:text-cream">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time (Half-hour steps, strictly > start) */}
              <div>
                <Label className="block text-xs font-mono font-bold uppercase text-foreground mb-1.5 opacity-90">
                  End Time (30m)
                </Label>
                <select
                  value={filters.end}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, end: e.target.value }))
                  }
                  className="brutal-flat w-full h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer hover:bg-sun/20 dark:hover:bg-grape transition-colors"
                >
                  {availableEndOptions.map((t) => (
                    <option key={t.value} value={t.value} className="bg-paper text-ink dark:bg-void dark:text-cream">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Period Presets */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1 mr-1">
                <Sparkles className="size-3 text-acid" /> Quick Periods:
              </span>
              {PERIOD_PRESETS.map((p) => {
                const isActive =
                  filters.start === p.start && filters.end === p.end;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        start: p.start,
                        end: p.end,
                      }))
                    }
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-all border ${
                      isActive
                        ? "bg-acid text-obsidian border-acid"
                        : "bg-paper text-ink border-border hover:border-foreground dark:bg-void dark:text-cream dark:border-border dark:hover:bg-grape"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
              <span>
                Filtering: <strong className="text-foreground">{filters.start}</strong>{" "}
                to <strong className="text-foreground">{filters.end}</strong>
                {filters.floor !== "" && (
                  <> · Floor: <strong className="text-foreground">{filters.floor === "0" ? "Ground" : filters.floor}</strong></>
                )}
                {filters.type && (
                  <> · Type: <strong className="text-foreground">{filters.type === "class" ? "Classroom" : "Lab"}</strong></>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-acid"></span>
                  Free: <strong className="text-acid">{freeRooms.length}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-hyper"></span>
                  Occupied: <strong className="text-hyper">{occupiedRooms.length}</strong>
                </span>
              </span>
            </div>
          </section>

          {/* Rooms Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground font-mono flex items-center justify-center">
              <Loader2 className="size-6 animate-spin mr-2" />
              Scanning room availability...
            </div>
          ) : (
            <section className="space-y-6">
              {/* Free Rooms */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block size-2.5 rounded-full bg-acid"></span>
                  <h2 className="font-display font-extrabold text-lg text-foreground uppercase tracking-wide">
                    Available Rooms ({freeRooms.length})
                  </h2>
                </div>

                {freeRooms.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground p-4 brutal bg-card rounded border-border">
                    No free rooms found for this slot and filter criteria.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {freeRooms.map((room) => (
                      <RoomCard
                        key={room._id}
                        room={room}
                        canBook={true}
                        onBook={() => setSelectedRoomForBooking(room)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Occupied Rooms */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block size-2.5 rounded-full bg-hyper"></span>
                  <h2 className="font-display font-extrabold text-lg text-foreground uppercase tracking-wide">
                    Occupied Rooms ({occupiedRooms.length})
                  </h2>
                </div>

                {occupiedRooms.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground p-4 brutal bg-card rounded border-border">
                    No rooms are occupied in this slot.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {occupiedRooms.map((room) => (
                      <RoomCard
                        key={room._id}
                        room={room}
                        canBook={false}
                        occupiedBy={room.occupiedBy}
                        canCancelCurrent={room.canCancelCurrent}
                        activeBookingId={room.activeBookingId}
                        activeTimetableId={room.activeTimetableId}
                        onCancelBooking={handleCancelBooking}
                        onCancelTimetable={handleCancelTimetable}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Book Room Modal */}
      <BookModal
        isOpen={!!selectedRoomForBooking}
        room={selectedRoomForBooking}
        defaultStart={filters.start}
        defaultEnd={filters.end}
        onClose={() => setSelectedRoomForBooking(null)}
        onSuccess={() => {
          fetchAvailability(true);
          setMessage({
            type: "success",
            text: `Room ${selectedRoomForBooking?.name} booked successfully!`,
          });
        }}
      />
    </div>
  );
}
