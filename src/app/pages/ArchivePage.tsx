import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Search, SortDesc, FileText, Lock, Sparkles, Eye, Archive, X, Settings, Loader2, AlertTriangle, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { deleteCapsule, getAllCapsules, todayString } from "../../lib/capsules";
import { useAuth } from "../../lib/auth";
import type { Capsule } from "../../lib/capsules";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";
import CapsuleCard from "../components/archive/CapsuleCard";

type FilterTab = "all" | "draft" | "sealed" | "opened" | "received";
type SortMode = "updated" | "created" | "opens_soon" | "opens_late";

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Archive className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  { key: "draft", label: "Drafts", icon: <FileText className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  { key: "sealed", label: "Sealed", icon: <Lock className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  { key: "opened", label: "Opened", icon: <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  { key: "received", label: "Received", icon: <Mail className="w-3.5 h-3.5" strokeWidth={2.5} /> },
];

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "updated", label: "Recently updated" },
  { key: "created", label: "Newest first" },
  { key: "opens_soon", label: "Opens soonest" },
  { key: "opens_late", label: "Opens latest" },
];

function getEffectiveStatus(c: Capsule): "draft" | "sealed" | "ready" | "opened" {
  if (c.status === "draft") return "draft";
  if (c.status === "opened") return "opened";
  if (c.openDate && c.openDate <= todayString()) return "ready";
  return "sealed";
}

function matchesSearch(capsule: Capsule, query: string): boolean {
  const q = query.toLowerCase();
  if (capsule.title.toLowerCase().includes(q)) return true;
  const effective = getEffectiveStatus(capsule);
  if (effective !== "sealed" && capsule.message.toLowerCase().includes(q)) return true;
  if (capsule.tags?.some((t) => t.toLowerCase().includes(q))) return true;
  if (capsule.mood?.toLowerCase().includes(q)) return true;
  return false;
}

function sortCapsules(capsules: Capsule[], mode: SortMode): Capsule[] {
  return [...capsules].sort((a, b) => {
    switch (mode) {
      case "updated":
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "opens_soon": {
        if (!a.openDate && !b.openDate) return 0;
        if (!a.openDate) return 1;
        if (!b.openDate) return -1;
        return a.openDate.localeCompare(b.openDate);
      }
      case "opens_late": {
        if (!a.openDate && !b.openDate) return 0;
        if (!a.openDate) return 1;
        if (!b.openDate) return -1;
        return b.openDate.localeCompare(a.openDate);
      }
    }
  });
}

export default function ArchivePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [allCapsules, setAllCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  const initialFilter = (location.state as { filter?: FilterTab } | null)?.filter || "all";
  const [filter, setFilter] = useState<FilterTab>(initialFilter);
  const [sort, setSort] = useState<SortMode>("updated");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getAllCapsules()
      .then(setAllCapsules)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteCapsule(capsule: Capsule) {
    setErrorMsg("");
    try {
      await deleteCapsule(capsule.id);
      setAllCapsules((current) => current.filter((c) => c.id !== capsule.id));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to delete capsule");
    }
  }

  // Counts per tab
  const counts = useMemo(() => ({
    all: allCapsules.length,
    draft: allCapsules.filter((c) => c.status === "draft").length,
    sealed: allCapsules.filter((c) => c.status === "sealed").length,
    opened: allCapsules.filter((c) => c.status === "opened").length,
    received: allCapsules.filter((c) => c.userId !== user?.id).length,
  }), [allCapsules, user]);

  // Filter
  const filtered = useMemo(() => {
    let result = allCapsules;
    if (filter === "draft") result = result.filter((c) => c.status === "draft");
    else if (filter === "sealed") result = result.filter((c) => c.status === "sealed");
    else if (filter === "opened") result = result.filter((c) => c.status === "opened");
    else if (filter === "received") result = result.filter((c) => c.userId !== user?.id);

    if (search.trim()) {
      result = result.filter((c) => matchesSearch(c, search.trim()));
    }

    return sortCapsules(result, sort);
  }, [allCapsules, filter, sort, search]);

  if (loading) {
    return (
      <RetroPageBackground sparkleCount={3}>
        <RetroWindow title="MEMORY ARCHIVE v1.0" maxWidth="max-w-4xl">
          <div className="p-10 flex items-center justify-center min-h-[300px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-black/30" strokeWidth={2.5} />
            </motion.div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  return (
    <RetroPageBackground sparkleCount={5}>
      <RetroWindow title="MEMORY ARCHIVE v1.0" maxWidth="max-w-4xl">
        <div className="p-5 sm:p-10">
          <SectionHeader
            title="YOUR ARCHIVE"
            subtitle="Everything you've written, sealed, and saved — all in one place."
            size="md"
          />

          {errorMsg && (
            <motion.div
              className="mt-4 mb-5 flex items-center gap-2 rounded-lg border-[2px] border-[#d4183d]/40 bg-[#FFF0F0] px-4 py-3 text-xs font-bold text-[#d4183d]"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              {errorMsg}
            </motion.div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-[2px] font-bold text-xs uppercase tracking-wide transition-all ${
                  filter === tab.key
                    ? "bg-white/80 border-black/70 border-b-white/80 text-black shadow-[1px_-1px_0_0_rgba(0,0,0,0.1)] -mb-[2px] relative z-10"
                    : "bg-white/30 border-black/30 text-black/50 hover:bg-white/50 hover:text-black/70"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === tab.key
                    ? "bg-black/10 text-black/70"
                    : "bg-black/5 text-black/35"
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search & sort bar */}
          <div className="flex gap-2 mb-6 border-t-[2px] border-black/20 pt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 pointer-events-none" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search by title, tag, or mood..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="retro-input pl-9 pr-8 !py-2.5 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="h-full px-3 bg-white/50 border-[2.5px] border-black/60 rounded-[var(--retro-radius-input)] font-bold text-xs uppercase tracking-wide text-black/60 hover:bg-white/80 hover:border-black/80 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <SortDesc className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Sort</span>
              </button>

              {showSort && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowSort(false)} />
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white border-[2.5px] border-black/80 rounded-lg shadow-[var(--retro-shadow-selected)] py-1 min-w-[180px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSort(opt.key); setShowSort(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                          sort === opt.key
                            ? "bg-retro-page/60 text-black"
                            : "text-black/60 hover:bg-retro-page/30 hover:text-black"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Capsule list or empty state */}
          {allCapsules.length === 0 ? (
            <EmptyState type="all" />
          ) : filtered.length === 0 ? (
            search.trim() ? (
              <EmptyState type="search" query={search} />
            ) : (
              <EmptyState type={filter} />
            )
          ) : (
            <div className="space-y-4">
              {filtered.map((capsule, i) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  index={i}
                  onDelete={handleDeleteCapsule}
                />
              ))}
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2.5px] border-black/30">
            <div className="flex items-center gap-2">
              <RetroButton variant="ghost" onClick={() => navigate("/")}>
                Home
              </RetroButton>
              <button
                onClick={() => navigate("/settings")}
                className="p-2.5 bg-white/40 border-[2px] border-black/40 rounded-lg text-black/40 hover:text-black/70 hover:border-black/60 hover:bg-white/60 transition-all"
              >
                <Settings className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <RetroButton onClick={() => navigate("/compose")}>
              <Plus className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={3} />
              New Capsule
            </RetroButton>
          </div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}

// --- Per-filter empty states ---

function EmptyState({ type, query }: { type: FilterTab | "search" | "received"; query?: string }) {
  const navigate = useNavigate();

  const config = {
    all: {
      icon: <Archive className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "Your archive is quiet for now",
      body: "Write something to your future self. It'll be waiting here when you do.",
      cta: "Write Your First Capsule →",
      action: () => navigate("/compose"),
    },
    draft: {
      icon: <FileText className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "No unfinished letters",
      body: "Drafts live here when you're not ready to seal them yet.",
      cta: "Start Writing →",
      action: () => navigate("/compose"),
    },
    sealed: {
      icon: <Lock className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "Nothing sealed yet",
      body: "When you seal a capsule, it waits here quietly until its day comes.",
      cta: "Seal Your First Capsule →",
      action: () => navigate("/compose"),
    },
    opened: {
      icon: <Eye className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "No opened memories yet",
      body: "Once you open a capsule, it lives here as a keepsake.",
      cta: null,
      action: () => {},
    },
    received: {
      icon: <Mail className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "No received capsules",
      body: "When someone shares a time capsule with you, it will appear here.",
      cta: null,
      action: () => {},
    },
    search: {
      icon: <Search className="w-10 h-10 text-black/25" strokeWidth={2} />,
      title: "Nothing found",
      body: `No capsules matched "${query}". Try something else.`,
      cta: null,
      action: () => {},
    },
  };

  const c = config[type];

  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="mx-auto mb-5 w-24 h-24 relative"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-retro-page to-retro-titlebar-to border-[2.5px] border-black/30 rounded-xl border-dashed flex items-center justify-center">
          {c.icon}
        </div>
      </motion.div>

      <p className="text-base font-bold text-black/65 mb-1.5">{c.title}</p>
      <p className="text-sm text-black/45 font-medium mb-5 max-w-xs mx-auto">{c.body}</p>
      {c.cta && (
        <RetroButton onClick={c.action}>
          {c.cta}
        </RetroButton>
      )}
    </motion.div>
  );
}
