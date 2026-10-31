import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { adminApi } from "../api/adminApi";
import {
  Package,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Tag,
  ShieldAlert,
  Loader2,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";

export function LostFoundModerationTab() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [message, setMessage] = useState(null);

  // Deletion modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview image modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getLostFound({
        q: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load Lost & Found items" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter, categoryFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminApi.updateLostFoundStatus(id, newStatus);
      setMessage({
        type: "success",
        text: `Item status updated to '${newStatus}'`,
      });
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update item status",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteLostFound(deleteCandidate._id);
      setMessage({
        type: "success",
        text: `Item "${deleteCandidate.title}" removed permanently.`,
      });
      setDeleteCandidate(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete item",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="brutal-sm flex flex-col justify-between gap-4 bg-paper p-4 dark:bg-void sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-black uppercase text-foreground">
            <Package className="size-6 text-hyper" /> Lost & Found Moderation
          </h2>
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Global catalog oversight • Override dispute status & prune violations
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          <span className="brutal-flat bg-ink px-2.5 py-1 text-cream dark:bg-cream dark:text-ink">
            {items.length} Listed Items
          </span>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`brutal-sm flex items-center justify-between p-3 font-mono text-xs font-bold ${
            message.type === "error"
              ? "bg-hyper text-white"
              : "bg-mint text-ink dark:bg-acid dark:text-black"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="hover:opacity-80"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="brutal-sm grid grid-cols-1 gap-3 bg-paper p-4 dark:bg-void sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description..."
            className="pl-8 text-xs font-semibold"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="brutal-sm w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
          >
            <option value="">All Statuses (Open / Claimed / Resolved)</option>
            <option value="open">Open (Unclaimed)</option>
            <option value="claimed">Claimed (Pending Verification)</option>
            <option value="resolved">Resolved (Returned)</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="brutal-sm w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
          >
            <option value="">All Types (Lost & Found)</option>
            <option value="lost">Lost Items Only</option>
            <option value="found">Found Items Only</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="brutal-sm w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics (Laptops, Chargers, Audio)</option>
            <option value="id_cards">ID Cards & Wallets</option>
            <option value="books">Books & Notebooks</option>
            <option value="clothing">Clothing & Accessories</option>
            <option value="keys">Keys</option>
            <option value="bottles">Bottles & Lunchboxes</option>
            <option value="other">Other Campus Gear</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="brutal-sm flex items-center justify-center gap-2 bg-paper p-12 text-sm font-bold text-muted-foreground dark:bg-void">
          <Loader2 className="size-5 animate-spin text-hyper" />
          Querying Lost & Found database...
        </div>
      ) : items.length === 0 ? (
        <div className="brutal-sm bg-paper p-12 text-center text-muted-foreground dark:bg-void">
          <Package className="mx-auto size-10 opacity-40" />
          <p className="font-display mt-3 text-lg font-bold uppercase text-foreground">
            No items matched your filters
          </p>
          <p className="font-mono text-xs">
            Adjust search criteria or check again later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const isLost = item.type === "lost";
            return (
              <div
                key={item._id}
                className="brutal flex flex-col justify-between bg-card p-4 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  {/* Top line badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2px] border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`brutal-flat px-2 py-0.5 font-mono text-[10px] font-black uppercase ${
                          isLost
                            ? "bg-hyper text-white"
                            : "bg-mint text-ink dark:bg-acid dark:text-black"
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      <span className="brutal-flat border border-border bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-foreground uppercase dark:bg-void">
                        {item.category?.replace("_", " ")}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`brutal-flat px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase ${
                          item.status === "open"
                            ? "bg-sun text-ink"
                            : item.status === "claimed"
                            ? "bg-cobalt text-white"
                            : "bg-ink text-cream dark:bg-cream dark:text-ink"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-3 flex gap-3">
                    {item.image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(item.image)}
                        className="brutal-sm relative size-20 shrink-0 overflow-hidden border-2 border-border bg-ink/10 transition-transform hover:scale-105"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                          <ExternalLink className="size-4 text-white" />
                        </div>
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-extrabold text-foreground truncate">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.description || "No description provided."}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-hyper" />
                          {item.location || "Location unstated"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-cobalt" />
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reporter & Claim Info */}
                  <div className="brutal-sm mt-3 border border-border bg-paper p-2.5 font-mono text-xs dark:bg-void">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 font-bold text-foreground">
                        <User className="size-3.5 text-mint" />
                        Reported By:
                      </span>
                      <span className="font-bold text-foreground">
                        {item.reportedBy?.name || "Anonymous Cadet"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>USN / Email:</span>
                      <span>
                        {item.reportedBy?.usn || item.reportedBy?.email || "N/A"}
                      </span>
                    </div>
                    {item.claimantId && (
                      <div className="mt-1.5 border-t border-dashed border-border pt-1.5 text-[11px]">
                        <span className="font-bold text-cobalt">
                          Claimed by: {item.claimantId?.name} ({item.claimantId?.usn || item.claimantId?.email})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Administrative Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t-[2px] border-border pt-3">
                  <div className="flex items-center gap-2">
                    <label className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      Override:
                    </label>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      className="brutal-sm border border-border bg-paper px-2 py-1 font-mono text-[11px] font-bold text-foreground outline-none dark:bg-void"
                    >
                      <option value="open">Open</option>
                      <option value="claimed">Claimed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteCandidate(item)}
                    className="brutal-sm gap-1.5 font-mono text-xs font-bold uppercase"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="brutal w-full max-w-md bg-card p-6 text-foreground">
            <div className="flex items-center gap-3 text-hyper">
              <ShieldAlert className="size-7" />
              <h3 className="font-display text-lg font-black uppercase">
                Confirm Admin Deletion
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              You are about to permanently purge this item from the campus board:
            </p>
            <div className="brutal-sm my-3 border border-border bg-paper p-3 font-mono text-xs font-bold text-foreground dark:bg-void">
              "{deleteCandidate.title}" • {deleteCandidate.type.toUpperCase()}
            </div>
            <p className="text-[11px] font-semibold text-hyper">
              This action cannot be undone. Associated claim threads or notifications will be severed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="brutal-sm font-mono text-xs font-bold uppercase"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="brutal-sm gap-1.5 font-mono text-xs font-bold uppercase"
              >
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                Purge Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="brutal max-h-[85vh] max-w-2xl overflow-hidden bg-card p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-1">
              <button
                onClick={() => setPreviewImage(null)}
                className="brutal-flat bg-ink p-1 text-cream hover:bg-hyper dark:bg-cream dark:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Item Full View"
              className="max-h-[75vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
