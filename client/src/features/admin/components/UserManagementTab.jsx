import { useState, useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { adminApi } from "../api/adminApi";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  KeyRound,
  Loader2,
  X,
} from "lucide-react";

export function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    usn: "",
    department: "CSE",
    classKey: "",
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers({
        q: search || undefined,
        role: roleFilter || undefined,
        classKey: classFilter || undefined,
        department: departmentFilter || undefined,
      });
      setUsers(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load user roster" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, roleFilter, classFilter, departmentFilter]);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      email: "",
      password: "password123",
      role: "student",
      usn: "",
      department: "CSE",
      classKey: "",
    });
    setEditingUser(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      usn: user.usn || "",
      department: user.department || "CSE",
      classKey: user.classKey || "",
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === "cr" && !formData.classKey.trim()) {
      setMessage({ type: "error", text: "CR role requires a classKey (e.g. CSE-5A)" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await adminApi.updateUser(editingUser._id, payload);
        setMessage({ type: "success", text: `Updated ${formData.name} successfully` });
      } else {
        await adminApi.createUser(formData);
        setMessage({ type: "success", text: `Created user ${formData.name} successfully` });
      }
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to save user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) return;
    try {
      await adminApi.deleteUser(user._id);
      setMessage({ type: "success", text: `User ${user.name} deleted` });
      fetchUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to delete user",
      });
    }
  };

  const getRoleBadge = (role, classKey) => {
    switch (role) {
      case "admin":
        return "bg-hyper text-white border-hyper";
      case "teacher":
        return "bg-cobalt text-white border-cobalt";
      case "cr":
        return "bg-acid text-obsidian border-acid font-extrabold";
      default:
        return "bg-black/10 text-foreground border-border dark:bg-white/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header & Search */}
      <div className="brutal bg-card p-4 border-border rounded-md text-foreground flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, USN, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs font-mono"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="brutal-flat h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="cr">CR (Class Rep)</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="brutal-flat h-10 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
          >
            <option value="">All Depts</option>
            <option value="CSE">CSE</option>
            <option value="AIML">AIML</option>
            <option value="Admin">Admin</option>
          </select>

          {/* ClassKey Filter */}
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

        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 h-10 px-4 font-display text-xs font-extrabold uppercase tracking-wider"
        >
          <Plus className="size-4" /> Add Cadet / Faculty
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

      {/* Users Table */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground font-mono flex items-center justify-center">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading campus roster...
        </div>
      ) : (
        <div className="brutal bg-card border-border rounded-md overflow-x-auto text-foreground">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper dark:bg-void border-b border-border text-muted-foreground uppercase tracking-widest text-[11px]">
              <tr>
                <th className="p-3.5">Name / Email</th>
                <th className="p-3.5">USN</th>
                <th className="p-3.5">Dept</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users match your search or filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-sun/10 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold font-sans text-sm text-foreground">{u.name}</div>
                      <div className="text-muted-foreground text-[11px] opacity-80">{u.email}</div>
                    </td>
                    <td className="p-3.5 font-bold">{u.usn || "—"}</td>
                    <td className="p-3.5">{u.department || "—"}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${getRoleBadge(
                          u.role,
                          u.classKey
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {u.classKey ? (
                        <span className="font-bold text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30">
                          {u.classKey}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(u)}
                        className="h-8 px-2.5 text-[11px] font-bold"
                      >
                        <Edit2 className="size-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(u)}
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

      {/* Modal: Create or Edit User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="brutal-lg max-w-md w-full bg-card p-6 shadow-2xl relative text-foreground border-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl uppercase text-foreground">
                  {editingUser ? "Edit Profile & Role" : "Create Campus User"}
                </h3>
                <p className="text-muted-foreground text-xs font-mono mt-0.5">
                  Set permissions, credentials, and section assignments.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="font-bold text-foreground opacity-60 hover:opacity-100 text-xl leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 font-mono text-xs">
              <div>
                <Label className="block uppercase text-foreground mb-1 font-bold">Full Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Saaim Khan / Dr. Vidyaraj"
                />
              </div>

              <div>
                <Label className="block uppercase text-foreground mb-1 font-bold">Campus Email</Label>
                <Input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. 2024cs_name_c@nie.ac.in"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Role</Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="brutal-flat w-full h-11 px-3 text-xs font-mono font-semibold bg-paper text-ink dark:bg-void dark:text-cream border-border rounded cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="cr">CR (Class Rep)</option>
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="CSE / AIML"
                  />
                </div>
              </div>

              {formData.role === "cr" && (
                <div className="p-3 bg-acid/10 border border-acid/50 rounded">
                  <Label className="block uppercase text-foreground mb-1 font-bold text-acid">
                    CR ClassKey (Required)
                  </Label>
                  <Input
                    required
                    value={formData.classKey}
                    onChange={(e) => setFormData({ ...formData, classKey: e.target.value })}
                    placeholder="e.g. CSE-5A / AIML-5B"
                    className="border-acid"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Allows CR to override/cancel slots for this section only.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">USN</Label>
                  <Input
                    value={formData.usn}
                    onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                    placeholder="4NI22CS001"
                  />
                </div>
                <div>
                  <Label className="block uppercase text-foreground mb-1 font-bold">
                    {editingUser ? "Reset Password" : "Password"}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep" : "min 6 characters"}
                  />
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
                  ) : editingUser ? (
                    "Save Changes"
                  ) : (
                    "Create User"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
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
