import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { pollsApi } from "../api/pollsApi";
import { PollCard } from "../components/PollCard";
import { CreatePollModal } from "../components/CreatePollModal";
import {
  Vote,
  Plus,
  Flame,
  GraduationCap,
  Sparkles,
  Filter,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export function PollsPage() {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all", "election", "flash", "my-class"
  const [statusFilter, setStatusFilter] = useState("active"); // "active", "all", "closed"
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [message, setMessage] = useState(null);

  const canCreate =
    isAdmin || user?.role === "cr" || user?.role === "teacher";

  const fetchPolls = async () => {
    setIsLoading(true);
    try {
      const data = await pollsApi.getPolls();
      setPolls(data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load active ballots. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Deduplicated poll adder / updater
  const upsertPoll = (incoming) => {
    if (!incoming || !incoming._id) return;
    setPolls((prev) => {
      const exists = prev.some((p) => String(p._id) === String(incoming._id));
      if (exists) {
        return prev.map((p) =>
          String(p._id) === String(incoming._id) ? { ...p, ...incoming } : p
        );
      }
      return [incoming, ...prev];
    });
  };

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePollVoted = ({ pollId, options, totalVotes }) => {
      setPolls((prev) =>
        prev.map((p) => {
          if (String(p._id) === String(pollId)) {
            return { ...p, options, totalVotes };
          }
          return p;
        })
      );
    };

    const handlePollClosed = ({ pollId }) => {
      setPolls((prev) =>
        prev.map((p) =>
          String(p._id) === String(pollId) ? { ...p, status: "closed" } : p
        )
      );
    };

    const handlePollDeleted = ({ pollId }) => {
      setPolls((prev) => prev.filter((p) => String(p._id) !== String(pollId)));
    };

    socket.on("poll_voted", handlePollVoted);
    socket.on("poll_created", upsertPoll);
    socket.on("poll_closed", handlePollClosed);
    socket.on("poll_deleted", handlePollDeleted);

    return () => {
      socket.off("poll_voted", handlePollVoted);
      socket.off("poll_created", upsertPoll);
      socket.off("poll_closed", handlePollClosed);
      socket.off("poll_deleted", handlePollDeleted);
    };
  }, [socket]);

  const handlePollUpdated = (updated) => {
    upsertPoll(updated);
  };

  const handlePollDeletedLocal = (pollId) => {
    setPolls((prev) => prev.filter((p) => String(p._id) !== String(pollId)));
  };

  // Filter logic
  const filteredPolls = polls.filter((poll) => {
    // Status filter
    const isExpired = new Date(poll.expiresAt) <= new Date();
    const isClosed = poll.status === "closed" || isExpired;

    if (statusFilter === "active" && isClosed) return false;
    if (statusFilter === "closed" && !isClosed) return false;

    // Type / Scope filter
    if (filterType === "election" && poll.type !== "election") return false;
    if (filterType === "flash" && poll.type !== "flash") return false;
    if (filterType === "my-class") {
      if (!user?.classKey) return false;
      return poll.classKey?.toUpperCase() === user.classKey.toUpperCase();
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero */}
      <div className="brutal bg-hyper p-5 text-white">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="brutal-flat flex size-7 items-center justify-center bg-white text-hyper">
                <Vote className="size-4" />
              </span>
              <h1 className="font-display text-2xl font-black tracking-wide uppercase sm:text-3xl">
                Campus Ballot Box
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs font-bold tracking-[0.18em] uppercase opacity-90">
              Democracy in Chaos • Real-time Flash Polls, CR Elections & Student Referendums
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPolls}
              disabled={isLoading}
              className="brutal-sm gap-1.5 border-white bg-white/10 font-mono text-xs font-bold text-white uppercase hover:bg-white/20"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {canCreate && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="brutal-sm gap-1.5 border-[2px] border-obsidian bg-sun font-mono text-xs font-black uppercase text-ink shadow-md hover:bg-sun/90"
              >
                <Plus className="size-4" />
                Launch Ballot
              </Button>
            )}
          </div>
        </div>

        {/* Quick summary counters */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs font-bold">
          <div className="brutal-sm bg-black/20 p-2.5">
            <p className="text-[10px] opacity-80 uppercase">Total Ballots</p>
            <p className="font-display text-xl font-black">{polls.length}</p>
          </div>
          <div className="brutal-sm bg-black/20 p-2.5">
            <p className="text-[10px] opacity-80 uppercase">Active Now</p>
            <p className="font-display text-xl font-black text-sun">
              {polls.filter((p) => p.status === "active" && new Date(p.expiresAt) > new Date()).length}
            </p>
          </div>
          <div className="brutal-sm bg-black/20 p-2.5">
            <p className="text-[10px] opacity-80 uppercase">CR Elections</p>
            <p className="font-display text-xl font-black">
              {polls.filter((p) => p.type === "election").length}
            </p>
          </div>
          <div className="brutal-sm bg-black/20 p-2.5">
            <p className="text-[10px] opacity-80 uppercase">My Section</p>
            <p className="font-display text-xl font-black text-mint">
              {user?.classKey || "None"}
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="brutal-sm bg-hyper p-3 font-mono text-xs font-bold text-white">
          {message}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="brutal-sm flex flex-col justify-between gap-3 bg-paper p-3 dark:bg-void sm:flex-row sm:items-center">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType("all")}
            className={`brutal-sm px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
              filterType === "all"
                ? "bg-ink text-cream dark:bg-cream dark:text-ink"
                : "bg-paper text-foreground hover:bg-hyper/10 dark:bg-void"
            }`}
          >
            All Ballots
          </button>
          <button
            onClick={() => setFilterType("election")}
            className={`brutal-sm flex items-center gap-1.5 px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
              filterType === "election"
                ? "bg-cobalt text-white"
                : "bg-paper text-foreground hover:bg-cobalt/10 dark:bg-void"
            }`}
          >
            <GraduationCap className="size-3.5" /> CR Elections
          </button>
          <button
            onClick={() => setFilterType("flash")}
            className={`brutal-sm flex items-center gap-1.5 px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
              filterType === "flash"
                ? "bg-hyper text-white"
                : "bg-paper text-foreground hover:bg-hyper/10 dark:bg-void"
            }`}
          >
            <Flame className="size-3.5" /> Flash Polls
          </button>
          {user?.classKey && (
            <button
              onClick={() => setFilterType("my-class")}
              className={`brutal-sm px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
                filterType === "my-class"
                  ? "bg-mint text-ink dark:bg-acid dark:text-black"
                  : "bg-paper text-foreground hover:bg-mint/20 dark:bg-void"
              }`}
            >
              My Section ({user.classKey})
            </button>
          )}
        </div>

        {/* Active vs Closed toggle */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="brutal-sm border-[2px] border-border bg-paper px-2.5 py-1.5 font-mono text-xs font-bold text-foreground outline-none dark:bg-void"
          >
            <option value="active">Active Only</option>
            <option value="closed">Closed / Past</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Poll Cards Grid */}
      {isLoading ? (
        <div className="brutal-sm flex items-center justify-center gap-2 bg-paper p-12 text-sm font-bold text-muted-foreground dark:bg-void">
          <Loader2 className="size-5 animate-spin text-hyper" />
          Synchronizing campus voting ledger...
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="brutal bg-paper p-12 text-center text-muted-foreground dark:bg-void">
          <Vote className="mx-auto size-12 opacity-40" />
          <h3 className="font-display mt-3 text-lg font-black uppercase text-foreground">
            No Ballots Found
          </h3>
          <p className="font-mono text-xs mt-1">
            {filterType === "my-class"
              ? `No active ballots currently scheduled for section ${user?.classKey}.`
              : "No polls match your active filters. Launch a new one above!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              onPollUpdated={handlePollUpdated}
              onPollDeleted={handlePollDeletedLocal}
            />
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPollCreated={upsertPoll}
      />
    </div>
  );
}

export default PollsPage;
