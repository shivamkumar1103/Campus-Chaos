import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { pollsApi } from "../api/pollsApi";
import {
  Vote,
  Plus,
  Trash2,
  X,
  Clock,
  Sparkles,
  Loader2,
  Users,
  AlertCircle,
} from "lucide-react";

export function CreatePollModal({ isOpen, onClose, onPollCreated }) {
  const { user, isAdmin } = useAuth();

  const isCr = user?.role === "cr";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pollType, setPollType] = useState(isCr ? "election" : "flash");
  const [targetScope, setTargetScope] = useState(isCr ? "class" : "campus");
  const [classKey, setClassKey] = useState(isCr ? user?.classKey || "" : "");
  const [durationHours, setDurationHours] = useState("24");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPollType(isCr ? "election" : "flash");
    setTargetScope(isCr ? "class" : "campus");
    setClassKey(isCr ? user?.classKey || "" : "");
    setDurationHours("24");
    setOptions(["", ""]);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const filteredOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      setErrorMessage("Please provide at least 2 valid options or candidates.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a title for this poll.");
      return;
    }

    const effectiveClassKey = (
      isCr ? user?.classKey || classKey : classKey
    ).trim().toUpperCase();

    if (targetScope === "class" && !effectiveClassKey) {
      setErrorMessage("Please specify a section/class key (e.g. CSE-5A).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type: pollType,
        targetScope,
        classKey: targetScope === "class" ? effectiveClassKey : "",
        department: user?.department || "CSE",
        options: filteredOptions.map((text) => ({ text })),
        durationHours: Number(durationHours) || 24,
      };

      const newPoll = await pollsApi.createPoll(payload);
      onPollCreated?.(newPoll);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || "Failed to create poll. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="brutal w-full max-w-lg bg-card p-6 text-foreground max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[2px] border-border pb-3">
          <div className="flex items-center gap-2">
            <Vote className="size-6 text-hyper" />
            <h2 className="font-display text-xl font-black uppercase text-foreground">
              Launch Official Ballot
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="brutal-flat bg-ink p-1 text-cream hover:bg-hyper dark:bg-cream dark:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="brutal-sm mt-4 flex items-center gap-2 bg-hyper p-2.5 font-mono text-xs font-bold text-white">
            <AlertCircle className="size-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <Label className="font-mono text-xs font-bold uppercase text-foreground">
              Poll / Election Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5th Sem CSE-5A Class Representative Election"
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="font-mono text-xs font-bold uppercase text-foreground">
              Description / Instructions (Optional)
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Vote for your representative. Verified one-vote ballot."
              className="mt-1"
            />
          </div>

          {/* Type & Scope grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-xs font-bold uppercase text-foreground">
                Ballot Category
              </Label>
              <select
                value={pollType}
                onChange={(e) => setPollType(e.target.value)}
                className="brutal-sm mt-1 w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
              >
                <option value="flash">Flash Poll (Opinion/Feedback)</option>
                <option value="election">CR Election (Official Rep)</option>
              </select>
            </div>

            <div>
              <Label className="font-mono text-xs font-bold uppercase text-foreground">
                Target Voter Roll
              </Label>
              <select
                value={targetScope}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetScope(val);
                  if (val === "class" && isCr) {
                    setClassKey(user?.classKey || "");
                  }
                }}
                className="brutal-sm mt-1 w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
              >
                <option value="campus">Campus-Wide (All Cadets)</option>
                <option value="class">
                  {isCr && user?.classKey
                    ? `My Section (${user.classKey})`
                    : "Section-Locked (Specific Class)"}
                </option>
              </select>
            </div>
          </div>

          {/* Class Key if section-locked */}
          {targetScope === "class" && (
            <div>
              <Label className="font-mono text-xs font-bold uppercase text-foreground flex items-center justify-between">
                <span>Class Section Key *</span>
                {isCr && user?.classKey && (
                  <span className="font-mono text-[10px] text-muted-foreground lowercase">
                    locked to your section
                  </span>
                )}
              </Label>
              <Input
                value={isCr ? (user?.classKey || classKey) : classKey}
                onChange={(e) => setClassKey(e.target.value)}
                disabled={isCr && Boolean(user?.classKey)}
                placeholder="e.g. CSE-5A, AIML-5B"
                required
                className="mt-1 uppercase disabled:opacity-80"
              />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Only students assigned to this section will be eligible to cast a ballot.
              </p>
            </div>
          )}

          {/* Duration Selector */}
          <div>
            <Label className="font-mono text-xs font-bold uppercase text-foreground">
              Ballot Box Open Duration
            </Label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="brutal-sm mt-1 w-full border-[2.5px] border-border bg-paper px-3 py-2 text-xs font-bold text-foreground outline-none dark:bg-void"
            >
              <option value="2">2 Hours (Flash Decision)</option>
              <option value="6">6 Hours (Half-Day)</option>
              <option value="24">24 Hours (Standard 1 Day)</option>
              <option value="48">48 Hours (2 Days)</option>
              <option value="72">72 Hours (3 Days Election)</option>
            </select>
          </div>

          {/* Options / Candidates list */}
          <div className="space-y-2 border-t-[2px] border-border pt-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs font-black uppercase text-foreground">
                Candidates / Choices ({options.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="brutal-sm gap-1 font-mono text-[11px] font-bold uppercase"
              >
                <Plus className="size-3" /> Add Choice
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="brutal-flat flex size-6 items-center justify-center bg-ink font-mono text-[10px] font-bold text-cream dark:bg-cream dark:text-ink shrink-0">
                    {index + 1}
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={
                      pollType === "election"
                        ? `Candidate Name (e.g. Cadet ${index + 1})`
                        : `Choice #${index + 1}`
                    }
                    required
                    className="text-xs"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="brutal-flat bg-paper p-2 text-hyper hover:bg-hyper hover:text-white dark:bg-void shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 border-t-[2px] border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="brutal-sm font-mono text-xs font-bold uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="brutal-sm gap-2 font-mono text-xs font-bold uppercase bg-hyper text-white hover:bg-hyper/90"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Vote className="size-3.5" />
              )}
              Open Ballot Box
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
