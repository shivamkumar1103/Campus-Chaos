import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { UserManagementTab } from "../components/UserManagementTab";
import { RoomManagementTab } from "../components/RoomManagementTab";
import { TimetableManagementTab } from "../components/TimetableManagementTab";
import { LostFoundModerationTab } from "../components/LostFoundModerationTab";
import { ChatAuditTab } from "../components/ChatAuditTab";
import {
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  Package,
  MessageSquare,
  Sparkles,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";

const TABS = [
  { id: "users", label: "Users & CRs", icon: Users, badge: "Roster" },
  { id: "rooms", label: "Rooms & Labs", icon: Building2, badge: "Infra" },
  { id: "timetable", label: "Timetable & CSV", icon: Calendar, badge: "Master" },
  { id: "lost-found", label: "Lost & Found", icon: Package, badge: "Moderation" },
  { id: "chats", label: "Safety & Audit", icon: MessageSquare, badge: "Logs" },
];

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "users";

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await adminApi.getOverview();
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin overview stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="brutal bg-ink p-5 text-cream dark:bg-acid dark:text-obsidian">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="brutal-flat flex size-7 items-center justify-center bg-hyper text-white">
                <ShieldCheck className="size-4" />
              </span>
              <h1 className="font-display text-2xl font-black tracking-wide uppercase sm:text-3xl">
                Admin Command Center
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs font-bold tracking-[0.18em] uppercase opacity-80">
              Institutional Authority • Access Control, Infrastructure & Safety Moderation
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={isLoadingStats}
            className="brutal-sm flex items-center gap-2 border-[2.5px] border-cream bg-paper px-3 py-1.5 font-mono text-xs font-bold text-ink uppercase transition-transform hover:-translate-y-0.5 dark:border-obsidian dark:bg-void dark:text-cream"
          >
            <RefreshCw className={`size-3.5 ${isLoadingStats ? "animate-spin" : ""}`} />
            Sync Stats
          </button>
        </div>

        {/* Live Overview Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Card 1: Users */}
          <div className="brutal-sm border-[2.5px] border-cream bg-paper p-3 text-ink dark:border-obsidian dark:bg-void dark:text-cream">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Total Cadets
              </span>
              <Users className="size-4 text-cobalt" />
            </div>
            <div className="font-display mt-2 text-2xl font-black">
              {isLoadingStats ? "..." : stats?.totalUsers ?? "—"}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground truncate">
              {stats?.userRoles?.student ?? 0} Students • {stats?.userRoles?.cr ?? 0} CRs • {stats?.userRoles?.teacher ?? 0} Staff
            </div>
          </div>

          {/* Card 2: Rooms */}
          <div className="brutal-sm border-[2.5px] border-cream bg-paper p-3 text-ink dark:border-obsidian dark:bg-void dark:text-cream">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Campus Infra
              </span>
              <Building2 className="size-4 text-mint dark:text-acid" />
            </div>
            <div className="font-display mt-2 text-2xl font-black">
              {isLoadingStats ? "..." : stats?.totalRooms ?? "—"}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {stats?.freeRoomsRightNow ?? 0} Free Now • {stats?.totalRooms - (stats?.freeRoomsRightNow ?? 0)} Occupied
            </div>
          </div>

          {/* Card 3: Timetable */}
          <div className="brutal-sm border-[2.5px] border-cream bg-paper p-3 text-ink dark:border-obsidian dark:bg-void dark:text-cream">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Master Schedule
              </span>
              <Calendar className="size-4 text-hyper" />
            </div>
            <div className="font-display mt-2 text-2xl font-black">
              {isLoadingStats ? "..." : stats?.totalTimetable ?? "—"}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              Active timetable periods weekly
            </div>
          </div>

          {/* Card 4: Lost & Found */}
          <div className="brutal-sm border-[2.5px] border-cream bg-paper p-3 text-ink dark:border-obsidian dark:bg-void dark:text-cream">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Lost & Found
              </span>
              <Package className="size-4 text-sun" />
            </div>
            <div className="font-display mt-2 text-2xl font-black">
              {isLoadingStats ? "..." : stats?.lostFound?.total ?? "—"}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {stats?.lostFound?.open ?? 0} Open • {stats?.lostFound?.claimed ?? 0} In Claim
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-border pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`brutal-sm flex items-center gap-2 px-3.5 py-2 font-display text-xs font-black tracking-wider uppercase transition-all ${
                isActive
                  ? "bg-hyper text-white shadow-md translate-y-[-2px]"
                  : "bg-paper text-foreground hover:bg-hyper/20 dark:bg-void"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              <span
                className={`brutal-flat px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${
                  isActive
                    ? "bg-white text-hyper"
                    : "bg-ink text-cream dark:bg-cream dark:text-ink"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Area */}
      <div className="pt-2">
        {currentTab === "users" && <UserManagementTab />}
        {currentTab === "rooms" && <RoomManagementTab />}
        {currentTab === "timetable" && <TimetableManagementTab />}
        {currentTab === "lost-found" && <LostFoundModerationTab />}
        {currentTab === "chats" && <ChatAuditTab />}
      </div>
    </div>
  );
}
export default AdminDashboard;
