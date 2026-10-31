import { useState, useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { adminApi } from "../api/adminApi";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react";

export function RoomManagementTab() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [floorFilter, setFloorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [message, setMessage] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    building: "Main Building",
    floor: 0,
    type: "class",
  });

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getRooms({
        floor: floorFilter !== "" ? floorFilter : undefined,
        type: typeFilter || undefined,
      });
      setRooms(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load rooms" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [floorFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({
      name: "",
      building: "Main Building",
      floor: 0,
      type: "class",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      building: room.building || "Main Building",
      floor: room.floor ?? 0,
      type: room.type || "class",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await adminApi.updateRoom(editingRoom._id, formData);
        setMessage({ type: "success", text: `Room ${formData.name} updated` });
      } else {
        await adminApi.createRoom(formData);
        setMessage({ type: "success", text: `Room ${formData.name} created` });
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to save room",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    if (!confirm(`Are you sure you want to delete room ${room.name}?`)) return;
    try {
      await adminApi.deleteRoom(room._id);
      setMessage({ type: "success", text: `Room ${room.name} deleted` });
      fetchRooms();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Cannot delete room",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls */}
      <div className="brutal bg-card p-4 border-border rounded-md text-foreground flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="brutal-flat h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
          >
            <option value="">All Floors</option>
            <option value="0">Ground Floor</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="brutal-flat h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
          >
            <option value="">All Types (Classroom & Lab)</option>
            <option value="class">Classroom Only</option>
            <option value="lab">Laboratory Only</option>
          </select>

          <span className="text-xs font-mono text-muted-foreground ml-auto hidden sm:inline">
            Total active facilities: <strong className="text-foreground">{rooms.length}</strong>
          </span>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 h-10 px-4 font-display text-xs font-extrabold uppercase tracking-wider"
        >
          <Plus className="size-4" /> Add Room / Lab
        </Button>
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

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground font-mono flex items-center justify-center">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading facilities...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {rooms.map((r) => (
            <div
              key={r._id}
              className="brutal bg-card border-border p-4 rounded-md text-foreground flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <h4 className="font-display font-extrabold text-lg text-foreground">{r.name}</h4>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                      r.type === "lab"
                        ? "border-hyper/40 text-hyper bg-hyper/10"
                        : "border-border text-muted-foreground bg-black/5 dark:bg-white/5"
                    }`}
                  >
                    {r.type === "class" ? "CLASSROOM" : "LAB"}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-4">
                  {r.building} · Floor {r.floor === 0 ? "Ground" : r.floor}
                </p>
              </div>

              <div className="flex gap-2 pt-2.5 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(r)}
                  className="flex-1 h-8 text-[11px] font-bold"
                >
                  <Edit2 className="size-3 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(r)}
                  className="h-8 px-2.5 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add or Edit Room */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="brutal-lg max-w-sm w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl uppercase text-foreground">
                  {editingRoom ? "Edit Room" : "Add Room / Lab"}
                </h3>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">
                  Configure facility metadata.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 font-mono text-xs">
              <div>
                <Label className="block uppercase text-foreground mb-1 font-bold">Room Name / Number</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 101, 204, CS Lab-2"
                />
              </div>

              <div>
                <Label className="block uppercase text-foreground mb-1 font-bold">Building</Label>
                <Input
                  required
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Main Building"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Floor (0=Ground)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Facility Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    <option value="class">Classroom</option>
                    <option value="lab">Laboratory</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-border">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : editingRoom ? (
                    "Save Room"
                  ) : (
                    "Create Room"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
