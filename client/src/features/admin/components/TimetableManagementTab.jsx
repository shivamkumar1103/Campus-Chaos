import { useState, useEffect, useMemo } from "react";
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
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";

const DAYS = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ALL_SEMESTERS = ["All", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const SECTIONS_BY_SEM = {
  "1st": [
    "CSE-1A", "CSE-1B", "CSE-1C", "CSE-1D", "CSE-1E", "CSE-1F", "CSE-1G", "CSE-1H",
    "AIML-1A", "AIML-1B"
  ],
  "3rd": [
    "CSE-3A", "CSE-3B", "CSE-3C", "CSE-3D", "CSE-3E", "CSE-3F", "CSE-3G", "CSE-3H",
    "AIML-3A", "AIML-3B"
  ],
  "5th": [
    "CSE-5A", "CSE-5B", "CSE-5C", "CSE-5D",
    "AIML-5A", "AIML-5B",
    "ISE-5A", "ISE-5B", "ISE-5C", "ISE-5D"
  ]
};

export function TimetableManagementTab() {
  const [entries, setEntries] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dayFilter, setDayFilter] = useState("All");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
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
    classKey: "CSE-3A",
    semester: "3rd",
  });

  // CSV Upload Modal & Preview
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Available classes based on selected semester
  const availableClasses = useMemo(() => {
    if (semesterFilter !== "All" && SECTIONS_BY_SEM[semesterFilter]) {
      return SECTIONS_BY_SEM[semesterFilter];
    }
    // Return all known sections flattened
    const allKnown = Object.values(SECTIONS_BY_SEM).flat();
    return Array.from(new Set(allKnown));
  }, [semesterFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, rData, uData] = await Promise.all([
        adminApi.getTimetable({
          day: dayFilter !== "All" ? dayFilter : undefined,
          semester: semesterFilter !== "All" ? semesterFilter : undefined,
          classKey: classFilter !== "All" ? classFilter : undefined,
          search: searchQuery.trim() || undefined,
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
  }, [dayFilter, semesterFilter, classFilter]);

  // Debounced or on-submit search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleSemesterChange = (newSem) => {
    setSemesterFilter(newSem);
    // If current class isn't in new semester's list, reset to All
    if (newSem !== "All" && SECTIONS_BY_SEM[newSem]) {
      if (!SECTIONS_BY_SEM[newSem].includes(classFilter)) {
        setClassFilter("All");
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      room: rooms[0]?._id || "",
      day: dayFilter !== "All" ? dayFilter : "Monday",
      start: "09:00",
      end: "10:00",
      subject: "",
      teacherId: teachers[0]?._id || "",
      classKey: classFilter !== "All" ? classFilter : "CSE-3A",
      semester: semesterFilter !== "All" ? semesterFilter : "3rd",
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
      semester: entry.semester || "3rd",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.start || !formData.end) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        room: formData.room || null,
        teacherId: formData.teacherId || null,
      };

      if (editingEntry) {
        await adminApi.updateTimetableEntry(editingEntry._id, payload);
        setMessage({ type: "success", text: `Updated ${formData.subject} slot` });
      } else {
        await adminApi.createTimetableEntry(payload);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setCsvFile(file || null);
    setCsvPreview(null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const roomIdx = header.indexOf("room");
        const classIdx = header.indexOf("classkey");
        const semIdx = header.indexOf("semester");

        const classes = new Set();
        const sems = new Set();
        let unassignedLabs = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (classIdx !== -1 && cols[classIdx]) classes.add(cols[classIdx]);
          if (semIdx !== -1 && cols[semIdx]) sems.add(cols[semIdx]);
          if (roomIdx !== -1 && (!cols[roomIdx] || cols[roomIdx].toLowerCase() === "unassigned")) {
            unassignedLabs++;
          }
        }

        setCsvPreview({
          totalSlots: lines.length - 1,
          classes: Array.from(classes).sort(),
          semesters: Array.from(sems).sort(),
          unassignedLabs,
        });
      } catch (err) {
        console.warn("CSV preview parse warning:", err);
      }
    };
    reader.readAsText(file);
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
      setCsvPreview(null);
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
      <div className="brutal bg-card p-4 border-border rounded-md text-foreground flex flex-col gap-4">
        {/* Row 1: Semester & Class & Search Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Filter className="size-3 text-acid" /> Sem:
              </span>
              <select
                value={semesterFilter}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="brutal-flat h-9 px-2.5 text-xs font-mono font-bold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
              >
                {ALL_SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Semesters" : `${s} Sem`}
                  </option>
                ))}
              </select>
            </div>

            {/* Section / Class Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">
                Class:
              </span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="brutal-flat h-9 px-2.5 text-xs font-mono font-bold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer max-w-[160px]"
              >
                <option value="All">All Sections</option>
                {semesterFilter === "All" ? (
                  <>
                    <optgroup label="1st Semester">
                      {SECTIONS_BY_SEM["1st"]?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="3rd Semester">
                      {SECTIONS_BY_SEM["3rd"]?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="5th Semester">
                      {SECTIONS_BY_SEM["5th"]?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject or code..."
                  className="h-9 pl-8 pr-2 text-xs font-mono w-48 md:w-56"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-9 px-2.5 text-xs font-mono">
                Find
              </Button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              onClick={() => {
                setCsvFile(null);
                setCsvPreview(null);
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-display font-extrabold uppercase tracking-wider"
            >
              <Upload className="size-3.5 text-acid" /> Bulk CSV
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 h-9 px-3.5 font-display text-xs font-extrabold uppercase tracking-wider"
            >
              <Plus className="size-4" /> Add Slot
            </Button>
          </div>
        </div>

        {/* Row 2: Day Filter Pills */}
        <div className="flex items-center gap-2 border-t border-border/40 pt-3 overflow-x-auto">
          <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground shrink-0">
            Day:
          </span>
          <div className="flex flex-wrap gap-1 border border-border p-1 rounded bg-paper dark:bg-void">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDayFilter(d)}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                  dayFilter === d
                    ? "bg-acid text-obsidian shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "All" ? "All Days" : d.slice(0, 3)}
              </button>
            ))}
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
                <th className="p-3.5">Day & Slot</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Class / Sem</th>
                <th className="p-3.5">Instructor</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No timetable slots found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item._id} className="hover:bg-sun/10 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold font-mono text-foreground">
                        {item.start} — {item.end}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {item.day}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {item.room ? (
                        <div>
                          <span className="font-bold text-foreground">
                            {item.room?.name || "Room"}
                          </span>{" "}
                          <span className="text-[10px] text-muted-foreground">
                            ({item.room?.type === "lab" ? "LAB" : "CLASS"})
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <AlertTriangle className="size-3" /> Unassigned Room
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans font-extrabold text-sm text-foreground">
                      {item.subject}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col gap-0.5">
                        {item.classKey ? (
                          <span className="font-bold text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30 w-fit">
                            {item.classKey}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {item.semester && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.semester} Sem
                          </span>
                        )}
                      </div>
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
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    <option value="">— Unassigned (TBD / Lab) —</option>
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
                    {DAYS.filter((d) => d !== "All").map((d) => (
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
                  placeholder="e.g. Operating Systems, DBMS Lab"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Semester</Label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="brutal-flat w-full h-11 px-2 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    {ALL_SEMESTERS.filter((s) => s !== "All").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Section</Label>
                  <Input
                    value={formData.classKey}
                    onChange={(e) => setFormData({ ...formData, classKey: e.target.value })}
                    placeholder="e.g. CSE-3A"
                  />
                </div>

                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Instructor</Label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="brutal-flat w-full h-11 px-2 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
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

      {/* Modal: Bulk CSV Upload with Live File Preview */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="brutal-lg max-w-lg w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
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
                onClick={() => {
                  setIsUploadOpen(false);
                  setCsvFile(null);
                  setCsvPreview(null);
                }}
                className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-4 font-mono text-xs">
              <div className="border-2 border-dashed border-border rounded p-5 text-center bg-paper/50 dark:bg-void/50">
                <FileText className="size-8 mx-auto text-acid mb-2" />
                <p className="font-bold text-foreground mb-1">Select .CSV Schedule File</p>
                <p className="text-[10px] text-muted-foreground mb-3 font-mono">
                  Format: room,day,start,end,subject,teacherEmail,classKey,semester
                </p>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={handleFileChange}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-acid file:text-obsidian file:cursor-pointer"
                />
              </div>

              {/* Dynamic CSV File Preview Box */}
              {csvPreview && (
                <div className="bg-paper dark:bg-void p-3.5 border-2 border-acid/50 rounded space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-acid text-sm">
                    <CheckCircle2 className="size-4" /> CSV Verified & Ready
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Total Slots:</span>{" "}
                      <span className="font-bold text-foreground">{csvPreview.totalSlots}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Semesters:</span>{" "}
                      <span className="font-bold text-foreground">
                        {csvPreview.semesters.join(", ") || "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Classes Detected ({csvPreview.classes.length}):</span>
                    <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                      {csvPreview.classes.map((cls) => (
                        <span
                          key={cls}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-muted/60 text-foreground border border-border rounded"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                  {csvPreview.unassignedLabs > 0 && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>
                        <strong>{csvPreview.unassignedLabs} lab slots</strong> have unassigned rooms. They will be imported as "Unassigned" and can be assigned by admin later.
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                  onClick={() => {
                    setIsUploadOpen(false);
                    setCsvFile(null);
                    setCsvPreview(null);
                  }}
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
