import { useState, useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { adminApi } from "../api/adminApi";
import {
  Calendar,
  Upload,
  Plus,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TimetableManagementTab() {
  const [entries, setEntries] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dayFilter, setDayFilter] = useState("Monday");
  const [classFilter, setClassFilter] = useState("");
  const [message, setMessage] = useState(null);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    room: "",
    day: "Monday",
    start: "09:00",
    end: "10:00",
    subject: "",
    teacherId: "",
    classKey: "CSE-5A",
    semester: "5th",
  });

  // CSV Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, rData, uData] = await Promise.all([
        adminApi.getTimetable({
          day: dayFilter || undefined,
          classKey: classFilter || undefined,
        }),
        adminApi.getRooms(),
        adminApi.getUsers({ role: "teacher" }),
      ]);
      setEntries(tData);
      setRooms(rData);
      setTeachers(uData);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load timetable schedule" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dayFilter, classFilter]);

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      room: rooms[0]?._id || "",
      day: dayFilter || "Monday",
      start: "09:00",
      end: "10:00",
      subject: "",
      teacherId: teachers[0]?._id || "",
      classKey: classFilter || "CSE-5A",
      semester: "5th",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      room: entry.room?._id || entry.room || "",
      day: entry.day,
      start: entry.start,
      end: entry.end,
      subject: entry.subject,
      teacherId: entry.teacherId?._id || entry.teacherId || "",
      classKey: entry.classKey || "",
      semester: entry.semester || "5th",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.room || !formData.subject || !formData.start || !formData.end) return;

    setIsSubmitting(true);
    try {
      if (editingEntry) {
        await adminApi.updateTimetableEntry(editingEntry._id, formData);
        setMessage({ type: "success", text: `Updated ${formData.subject} slot` });
      } else {
        await adminApi.createTimetableEntry(formData);
        setMessage({ type: "success", text: `Added ${formData.subject} slot` });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Conflict saving slot",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!confirm(`Delete slot ${entry.subject} (${entry.start}-${entry.end})?`)) return;
    try {
      await adminApi.deleteTimetableEntry(entry._id);
      setMessage({ type: "success", text: `Deleted slot` });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to delete slot",
      });
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", csvFile);

    try {
      const res = await adminApi.uploadTimetableCsv(fd);
      setMessage({
        type: "success",
        text: res.message || "Successfully imported timetable entries!",
      });
      setIsUploadOpen(false);
      setCsvFile(null);
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to parse CSV file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="brutal bg-card p-4 border-border rounded-md text-foreground flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Day Pills */}
          <div className="flex flex-wrap gap-1 border-2 border-border p-1 rounded bg-paper dark:bg-void">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDayFilter(d)}
                className={`px-2.5 py-1 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                  dayFilter === d
                    ? "bg-acid text-obsidian"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Section Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="brutal-flat h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
          >
            <option value="">All Sections</option>
            <option value="CSE-5A">CSE-5A</option>
            <option value="CSE-5B">CSE-5B</option>
            <option value="CSE-5C">CSE-5C</option>
            <option value="CSE-5D">CSE-5D</option>
            <option value="AIML-5A">AIML-5A</option>
            <option value="AIML-5B">AIML-5B</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-display font-extrabold uppercase tracking-wider"
          >
            <Upload className="size-3.5" /> Bulk CSV
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 h-10 px-4 font-display text-xs font-extrabold uppercase tracking-wider"
          >
            <Plus className="size-4" /> Add Slot
          </Button>
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

      {/* Timetable Slot List */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground font-mono flex items-center justify-center">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading timetable...
        </div>
      ) : (
        <div className="brutal bg-card border-border rounded-md overflow-x-auto text-foreground">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper dark:bg-void border-b border-border text-muted-foreground uppercase tracking-widest text-[11px]">
              <tr>
                <th className="p-3.5">Time Slot</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Section</th>
                <th className="p-3.5">Instructor</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No timetable slots scheduled for {dayFilter}.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item._id} className="hover:bg-sun/10 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold font-mono">
                      {item.start} — {item.end}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-foreground">
                        {item.room?.name || "Room"}
                      </span>{" "}
                      <span className="text-[10px] text-muted-foreground">
                        ({item.room?.type === "lab" ? "LAB" : "CLASS"})
                      </span>
                    </td>
                    <td className="p-3.5 font-sans font-extrabold text-sm text-foreground">
                      {item.subject}
                    </td>
                    <td className="p-3.5">
                      {item.classKey ? (
                        <span className="font-bold text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30">
                          {item.classKey}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {item.teacherId?.name || "—"}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 px-2.5 text-[11px] font-bold"
                      >
                        <Edit2 className="size-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item)}
                        className="h-8 px-2.5 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Single Slot Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="brutal-lg max-w-md w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl uppercase text-foreground">
                  {editingEntry ? "Edit Timetable Slot" : "Add Timetable Slot"}
                </h3>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">
                  Conflict-checked automatically upon save.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Room</Label>
                  <select
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.type === "lab" ? "Lab" : "Class"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Day</Label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="block uppercase text-foreground mb-1 font-bold">Subject Title</Label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. DBMS, Computer Networks Lab"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Start (HH:MM)</Label>
                  <Input
                    required
                    type="time"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">End (HH:MM)</Label>
                  <Input
                    required
                    type="time"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Class Section</Label>
                  <Input
                    value={formData.classKey}
                    onChange={(e) => setFormData({ ...formData, classKey: e.target.value })}
                    placeholder="CSE-5A"
                  />
                </div>

                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Instructor</Label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    <option value="">No Instructor</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
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
                      <Loader2 className="size-4 mr-2 animate-spin" /> Checking Conflict...
                    </>
                  ) : editingEntry ? (
                    "Update Slot"
                  ) : (
                    "Save Slot"
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

      {/* Modal: Bulk CSV Upload */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="brutal-lg max-w-md w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl uppercase text-foreground">
                  Bulk CSV Timetable Ingest
                </h3>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">
                  Import department schedule in 1-click.
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-4 font-mono text-xs">
              <div className="border-2 border-dashed border-border rounded p-6 text-center bg-paper/50 dark:bg-void/50">
                <FileText className="size-8 mx-auto text-acid mb-2" />
                <p className="font-bold text-foreground mb-1">Select .CSV Schedule File</p>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Format: room,day,start,end,subject,teacherEmail,classKey,semester
                </p>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-acid file:text-obsidian file:cursor-pointer"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-border">
                <Button
                  type="submit"
                  disabled={isUploading || !csvFile}
                  className="flex-1 py-2 font-display font-bold uppercase tracking-wider text-xs"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" /> Ingesting Schedule...
                    </>
                  ) : (
                    "Upload & Ingest"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
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
