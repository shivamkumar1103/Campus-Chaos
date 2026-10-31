import { useState, useEffect, useRef } from "react";
import { Button, Input } from "@/components/ui";
import { adminApi } from "../api/adminApi";
import {
  MessageSquare,
  Search,
  ShieldAlert,
  User,
  Clock,
  Lock,
  Loader2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  RefreshCw,
} from "lucide-react";

export function ChatAuditTab() {
  const [threads, setThreads] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [chatHistory, setChatHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);

  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    setErrorMessage(null);
    try {
      const data = await adminApi.getChatThreads();
      setThreads(data || []);
      // If we already had a selected thread, keep it or select the first
      if (!selectedThread && data && data.length > 0) {
        handleSelectThread(data[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load chat conversation threads");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleSelectThread = async (thread) => {
    setSelectedThread(thread);
    setIsLoadingHistory(true);
    try {
      const parts = (thread.conversationId || "").split("_");
      const u1Id = thread.user1?._id || parts[0];
      const u2Id = thread.user2?._id || parts[1];
      const history = await adminApi.getChatHistory(u1Id, u2Id);
      setChatHistory(history);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load message log for this thread");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (chatHistory?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Filter threads by student names or USNs
  const filteredThreads = threads.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const u1 = t.user1 || {};
    const u2 = t.user2 || {};
    return (
      u1.name?.toLowerCase().includes(q) ||
      u1.usn?.toLowerCase().includes(q) ||
      u1.email?.toLowerCase().includes(q) ||
      u2.name?.toLowerCase().includes(q) ||
      u2.usn?.toLowerCase().includes(q) ||
      u2.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="brutal-sm flex flex-col justify-between gap-4 bg-paper p-4 dark:bg-void sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-black uppercase text-foreground">
            <ShieldAlert className="size-6 text-cobalt" /> Campus Chat Safety & Audit
          </h2>
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Official records inspector • Student conduct, harassment & lost item dispute verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchThreads}
            disabled={isLoadingThreads}
            className="brutal-sm gap-1.5 font-mono text-xs font-bold uppercase"
          >
            <RefreshCw className={`size-3.5 ${isLoadingThreads ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
          <span className="brutal-flat bg-ink px-2.5 py-1 font-mono text-xs font-bold text-cream dark:bg-cream dark:text-ink">
            {threads.length} Threads Active
          </span>
        </div>
      </div>

      {/* Safety & Compliance Policy Banner */}
      <div className="brutal-sm flex items-start gap-3 bg-cobalt p-3.5 text-white">
        <Lock className="size-5 shrink-0 text-sun mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-sun">
            Administrative Audit Notice:
          </span>{" "}
          This log viewer is restricted to authorized campus administrators for incident investigations and dispute arbitration. Messages are logged cryptographically with timestamps.
        </div>
      </div>

      {errorMessage && (
        <div className="brutal-sm bg-hyper p-3 font-mono text-xs font-bold text-white">
          {errorMessage}
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Thread List */}
        <div className="brutal flex flex-col bg-card p-4 lg:col-span-5">
          <div className="relative mb-3">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or USN..."
              className="pl-8 text-xs font-semibold"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs font-bold text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-hyper" /> Loading conversation threads...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-muted-foreground">
                No conversation threads match your search.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected =
                  selectedThread?.conversationId === thread.conversationId;
                const u1 = thread.user1 || { name: "Cadet A" };
                const u2 = thread.user2 || { name: "Cadet B" };

                return (
                  <button
                    key={thread.conversationId}
                    type="button"
                    onClick={() => handleSelectThread(thread)}
                    className={`brutal-sm w-full text-left p-3 transition-all ${
                      isSelected
                        ? "border-[3px] border-hyper bg-paper shadow-md dark:bg-void"
                        : "border-[2px] border-border bg-paper hover:border-hyper/60 dark:bg-void"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-display text-xs font-black uppercase text-foreground truncate">
                        <span>{u1.name}</span>
                        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                        <span>{u2.name}</span>
                      </div>
                      <span className="brutal-flat shrink-0 bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold text-cream dark:bg-cream dark:text-ink">
                        {thread.totalMessages} msgs
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span className="truncate">
                        {u1.usn || u1.role || "Cadet"} ✦ {u2.usn || u2.role || "Cadet"}
                      </span>
                      <span className="shrink-0">
                        {thread.lastMessage?.createdAt
                          ? new Date(thread.lastMessage.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>

                    {(thread.lastMessage?.messageText || thread.lastMessage?.text) && (
                      <p className="mt-2 line-clamp-1 font-mono text-[11px] text-foreground/80 italic">
                        "{thread.lastMessage.messageText || thread.lastMessage.text}"
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Conversation Audit Inspector */}
        <div className="brutal flex flex-col bg-card p-4 lg:col-span-7">
          {selectedThread ? (
            <>
              {/* Thread Inspector Header */}
              <div className="border-b-[2px] border-border pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-black uppercase text-foreground">
                        {selectedThread.user1?.name || "Participant 1"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">↔</span>
                      <span className="font-display text-sm font-black uppercase text-foreground">
                        {selectedThread.user2?.name || "Participant 2"}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      ID: <span className="font-bold">{selectedThread.conversationId}</span>
                    </div>
                  </div>

                  <span className="brutal-flat bg-sun px-2 py-0.5 font-mono text-[10px] font-black uppercase text-ink">
                    Read-Only Audit Mode
                  </span>
                </div>

                {/* Participant details bar */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="brutal-sm border border-border bg-paper p-2 dark:bg-void">
                    <p className="font-bold text-foreground">
                      {selectedThread.user1?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      USN: {selectedThread.user1?.usn || "None"} • Role:{" "}
                      <span className="font-bold uppercase text-hyper">
                        {selectedThread.user1?.role || "student"}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedThread.user1?.email}
                    </p>
                  </div>

                  <div className="brutal-sm border border-border bg-paper p-2 dark:bg-void">
                    <p className="font-bold text-foreground">
                      {selectedThread.user2?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      USN: {selectedThread.user2?.usn || "None"} • Role:{" "}
                      <span className="font-bold uppercase text-hyper">
                        {selectedThread.user2?.role || "student"}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedThread.user2?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-2 max-h-[380px]">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-cobalt" /> Loading messages...
                  </div>
                ) : !chatHistory?.messages || chatHistory.messages.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                    No recorded messages in this thread.
                  </div>
                ) : (
                  chatHistory.messages.map((msg) => {
                    const isUser1 =
                      String(msg.senderId) === String(selectedThread.user1?._id);
                    const sender = isUser1
                      ? selectedThread.user1
                      : selectedThread.user2;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isUser1 ? "items-start" : "items-end"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px]">
                          <span className="font-bold text-foreground">
                            {sender?.name || (isUser1 ? "User 1" : "User 2")}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "numeric",
                                  month: "short",
                                })
                              : "—"}
                          </span>
                        </div>

                        <div
                          className={`brutal-sm max-w-[85%] p-3 text-xs font-medium ${
                            isUser1
                              ? "bg-paper text-foreground border-border dark:bg-void"
                              : "bg-cobalt text-white border-cobalt"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.messageText || msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer bar */}
              <div className="border-t-[2px] border-border pt-3">
                <div className="brutal-sm flex items-center justify-between bg-paper p-2.5 font-mono text-[11px] text-muted-foreground dark:bg-void">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Eye className="size-3.5 text-cobalt" /> Incident Log Inspector
                  </span>
                  <span>Messages timestamped according to server clock (IST)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="size-12 opacity-30" />
              <p className="font-display mt-3 text-base font-bold uppercase text-foreground">
                No Conversation Selected
              </p>
              <p className="font-mono text-xs">
                Select a thread from the roster on the left to inspect logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
