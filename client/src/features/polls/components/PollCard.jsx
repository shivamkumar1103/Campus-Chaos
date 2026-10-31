import { useState } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { pollsApi } from "../api/pollsApi";
import {
  Vote,
  Clock,
  CheckCircle2,
  Lock,
  Trash2,
  Sparkles,
  Users,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function PollCard({ poll, onPollUpdated, onPollDeleted }) {
  const { user, isAdmin } = useAuth();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const isElection = poll.type === "election";
  const isSectionLocked = poll.targetScope === "class";
  const isDeptLocked = poll.targetScope === "department";

  const isExpired = new Date(poll.expiresAt) <= new Date();
  const isClosed = poll.status === "closed" || isExpired;
  const hasVoted = Boolean(poll.userVotedOptionId);

  // Check student section eligibility
  let isEligible = true;
  let ineligibilityReason = "";

  if (!isAdmin && user) {
    if (isSectionLocked) {
      if (!user.classKey || user.classKey.toUpperCase() !== poll.classKey?.toUpperCase()) {
        isEligible = false;
        ineligibilityReason = `Strictly locked to ${poll.classKey} section cadets`;
      }
    } else if (isDeptLocked) {
      if (user.department?.toUpperCase() !== poll.department?.toUpperCase()) {
        isEligible = false;
        ineligibilityReason = `Locked to ${poll.department} department`;
      }
    }
  }

  const isCreatorOrAdmin =
    isAdmin || (user?._id && String(poll.createdBy?._id) === String(user._id));

  // Time remaining helper
  const getTimeRemaining = () => {
    if (isClosed) return "Voting Closed";
    const diffMs = new Date(poll.expiresAt) - new Date();
    if (diffMs <= 0) return "Voting Closed";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const handleVote = async () => {
    if (!selectedOptionId) {
      setErrorMessage("Please select an option before casting your ballot.");
      return;
    }
    setIsVoting(true);
    setErrorMessage(null);
    try {
      const res = await pollsApi.vote(poll._id, selectedOptionId);
      onPollUpdated?.(res.poll);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to record vote.");
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to officially close this poll early?")) return;
    setIsClosing(true);
    try {
      const res = await pollsApi.closePoll(poll._id);
      onPollUpdated?.(res.poll);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to close poll.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently purge this poll and all its cast ballots?")) return;
    setIsDeleting(true);
    try {
      await pollsApi.deletePoll(poll._id);
      onPollDeleted?.(poll._id);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to delete poll.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalVotes = poll.totalVotes || 0;

  return (
    <div
      className={`brutal flex flex-col justify-between bg-card p-5 transition-transform hover:-translate-y-0.5 ${
        isClosed ? "opacity-95" : ""
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2px] border-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`brutal-flat px-2 py-0.5 font-mono text-[10px] font-black uppercase ${
                isElection
                  ? "bg-cobalt text-white"
                  : "bg-hyper text-white"
              }`}
            >
              {isElection ? "CR ELECTION" : "FLASH POLL"}
            </span>

            {isSectionLocked && (
              <span className="brutal-flat border border-border bg-paper px-2 py-0.5 font-mono text-[10px] font-black text-foreground uppercase dark:bg-void">
                CLASS: {poll.classKey}
              </span>
            )}

            {!isSectionLocked && !isDeptLocked && (
              <span className="brutal-flat border border-border bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-foreground uppercase dark:bg-void">
                CAMPUS-WIDE
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-muted-foreground">
            <Clock className="size-3.5" />
            <span className={!isClosed ? "text-hyper font-black animate-pulse" : ""}>
              {getTimeRemaining()}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3">
          <h3 className="font-display text-lg font-black uppercase text-foreground leading-snug">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="mt-1 text-xs text-muted-foreground break-words leading-relaxed">
              {poll.description}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>
              By: <strong className="text-foreground">{poll.createdBy?.name || "Campus Admin"}</strong>{" "}
              ({poll.createdBy?.role?.toUpperCase() || "ADMIN"})
            </span>
            <span className="brutal-flat bg-ink px-2 py-0.5 font-mono text-[10px] font-bold text-cream dark:bg-cream dark:text-ink">
              {totalVotes} {totalVotes === 1 ? "Ballot" : "Ballots"} Cast
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="brutal-sm my-3 flex items-center gap-2 bg-hyper p-2.5 font-mono text-xs font-bold text-white">
            <AlertCircle className="size-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Ineligibility notice */}
        {!isEligible && (
          <div className="brutal-sm my-3 flex items-center gap-2 border border-border bg-paper p-2 font-mono text-xs text-muted-foreground dark:bg-void">
            <Lock className="size-3.5 text-hyper shrink-0" />
            <span>{ineligibilityReason}</span>
          </div>
        )}

        {/* Voting / Results Body */}
        <div className="mt-4 space-y-2.5">
          {poll.options.map((option) => {
            const votes = option.votesCount || 0;
            const percentage =
              totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isUserSelection =
              poll.userVotedOptionId === option._id ||
              poll.userVotedOptionId === String(option._id);
            const isSelected = selectedOptionId === option._id;

            // Candidate details if an election option
            const candidate = option.candidateId;

            // Show results view if: user voted, poll is closed, or user not eligible
            const showResults = hasVoted || isClosed || !isEligible;

            if (showResults) {
              return (
                <div
                  key={option._id}
                  className={`brutal-sm relative overflow-hidden border-[2px] p-3 transition-all ${
                    isUserSelection
                      ? "border-hyper bg-hyper/10 dark:bg-hyper/20"
                      : "border-border bg-paper dark:bg-void"
                  }`}
                >
                  {/* Background Progress Bar Fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-mint/30 dark:bg-acid/20 transition-all duration-700 pointer-events-none"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {isUserSelection && (
                        <CheckCircle2 className="size-4 text-hyper shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0 break-words leading-snug">
                        <span className="font-display text-xs font-extrabold uppercase text-foreground">
                          {option.text}
                        </span>
                        {candidate?.usn && (
                          <span className="ml-1.5 inline-block font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                            [{candidate.usn}]
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-black mt-0.5 ml-2">
                      <span className="text-foreground">{votes}</span>
                      <span className="text-muted-foreground text-[10px]">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Interactive ballot selection
            return (
              <label
                key={option._id}
                onClick={() => setSelectedOptionId(option._id)}
                className={`brutal-sm flex cursor-pointer items-start justify-between gap-3 border-[2.5px] p-3 transition-all ${
                  isSelected
                    ? "border-hyper bg-hyper/10 shadow-sm dark:bg-hyper/20"
                    : "border-border bg-paper hover:border-hyper/60 dark:bg-void"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-hyper bg-hyper text-white"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0 break-words leading-snug">
                    <span className="font-display text-xs font-bold uppercase text-foreground">
                      {option.text}
                    </span>
                    {candidate?.usn && (
                      <span className="ml-1.5 inline-block font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                        [{candidate.usn}]
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer / Action Bar */}
      <div className="mt-5 border-t-[2px] border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Status info */}
          <div className="font-mono text-xs font-bold text-muted-foreground">
            {hasVoted ? (
              <span className="flex items-center gap-1.5 text-mint dark:text-acid">
                <CheckCircle2 className="size-3.5" /> Ballot Recorded
              </span>
            ) : isClosed ? (
              <span className="text-muted-foreground">Ballot Box Sealed</span>
            ) : !user ? (
              <span>Login to cast ballot</span>
            ) : isEligible ? (
              <span>Select candidate above</span>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!hasVoted && !isClosed && isEligible && user && (
              <Button
                variant="default"
                size="sm"
                onClick={handleVote}
                disabled={isVoting || !selectedOptionId}
                className="brutal-sm gap-1.5 font-mono text-xs font-bold uppercase bg-hyper text-white hover:bg-hyper/90"
              >
                {isVoting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Vote className="size-3.5" />
                )}
                Cast Ballot
              </Button>
            )}

            {isCreatorOrAdmin && (
              <>
                {!isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isClosing}
                    className="brutal-sm font-mono text-[11px] font-bold uppercase"
                  >
                    {isClosing ? <Loader2 className="size-3 animate-spin" /> : "Close"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="brutal-sm p-2"
                  title="Delete Poll"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
