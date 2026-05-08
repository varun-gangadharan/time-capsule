import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Upload, Trash2, ArrowLeft, Sun, Zap, Info, Check, AlertTriangle, X, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import {
  getAllCapsules,
  exportCapsules,
  importCapsules,
  clearAllCapsules,
  getSettings,
  saveSettings,
} from "../../lib/capsules";
import type { AppSettings } from "../../lib/capsules";
import { useAuth } from "../../lib/auth";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";

type Toast = {
  type: "success" | "error" | "info";
  message: string;
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [settings, setSettingsState] = useState<AppSettings>({ theme: "expressive" });
  const [capsuleCount, setCapsuleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [capsules, s] = await Promise.all([
          getAllCapsules(),
          getSettings(),
        ]);
        setCapsuleCount(capsules.length);
        setSettingsState(s);
      } catch {
        // defaults are fine
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showToast(t: Toast) {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }

  // --- Export ---
  async function handleExport() {
    try {
      const data = await exportCapsules();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memory-capsule-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: "success", message: `Exported ${capsuleCount} capsule${capsuleCount !== 1 ? "s" : ""}` });
    } catch {
      showToast({ type: "error", message: "Export failed" });
    }
  }

  // --- Import ---
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const result = await importCapsules(ev.target?.result as string);
        if (result.added === 0 && result.skipped > 0) {
          showToast({ type: "info", message: `All ${result.skipped} capsule${result.skipped !== 1 ? "s" : ""} already existed — nothing new to add` });
        } else if (result.added === 0) {
          showToast({ type: "error", message: "No valid capsules found in that file" });
        } else {
          let msg = `Imported ${result.added} capsule${result.added !== 1 ? "s" : ""}`;
          if (result.skipped > 0) msg += `, ${result.skipped} already existed`;
          if (result.invalid > 0) msg += `, ${result.invalid} skipped (invalid)`;
          showToast({ type: "success", message: msg });
          // Refresh count
          const capsules = await getAllCapsules();
          setCapsuleCount(capsules.length);
        }
      } catch {
        showToast({ type: "error", message: "That file doesn't look like a valid capsule backup" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // --- Clear all ---
  async function handleClear() {
    try {
      await clearAllCapsules();
      setCapsuleCount(0);
      setShowClearConfirm(false);
      showToast({ type: "success", message: "All capsules have been removed" });
    } catch {
      showToast({ type: "error", message: "Failed to clear capsules" });
    }
  }

  // --- Theme ---
  async function handleThemeChange(theme: AppSettings["theme"]) {
    const next = { ...settings, theme };
    setSettingsState(next);
    try {
      await saveSettings(next);
    } catch {
      // Revert on error
      setSettingsState(settings);
    }
  }

  // --- Sign out ---
  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <RetroPageBackground sparkleCount={3}>
        <RetroWindow title="CONTROL PANEL v1.0" maxWidth="max-w-2xl">
          <div className="p-10 flex items-center justify-center min-h-[200px]">
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
    <RetroPageBackground sparkleCount={4}>
      <RetroWindow title="CONTROL PANEL v1.0" maxWidth="max-w-2xl">
        <div className="p-5 sm:p-10">
          <SectionHeader
            title="SETTINGS"
            subtitle="Manage your data, adjust how things look, and poke around."
            size="md"
          />

          {/* --- ACCOUNT SECTION --- */}
          <SettingsSection label="Account" icon={<LogOut className="w-4 h-4" strokeWidth={2.5} />}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/80">{user?.email}</p>
                <p className="text-xs text-black/40 font-medium">Signed in</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-white/50 border-[2px] border-black/40 rounded-lg text-xs font-bold uppercase tracking-wide text-black/50 hover:bg-white/80 hover:border-black/60 transition-all inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
                Sign Out
              </button>
            </div>
          </SettingsSection>

          {/* --- DATA SECTION --- */}
          <SettingsSection label="Data" icon={<Download className="w-4 h-4" strokeWidth={2.5} />}>
            <p className="text-xs text-black/45 font-medium mb-4">
              {capsuleCount === 0
                ? "No capsules stored yet."
                : `${capsuleCount} capsule${capsuleCount !== 1 ? "s" : ""} stored in your account.`
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <SettingsButton
                icon={<Download className="w-4 h-4" strokeWidth={2.5} />}
                label="Export Backup"
                sublabel="Download as JSON"
                onClick={handleExport}
                disabled={capsuleCount === 0}
              />
              <SettingsButton
                icon={<Upload className="w-4 h-4" strokeWidth={2.5} />}
                label="Import Backup"
                sublabel="Restore from file"
                onClick={handleImportClick}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Clear all */}
            <div className="mt-5 pt-5 border-t border-dashed border-black/15">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={capsuleCount === 0}
                  className="text-xs font-bold text-black/35 hover:text-[#d4183d] transition-colors uppercase tracking-wide inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Clear all capsule data
                </button>
              ) : (
                <motion.div
                  className="bg-[#FFF0F0] border-[2px] border-[#d4183d]/40 rounded-lg p-4"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm font-bold text-[#d4183d]/80 mb-1">
                    Erase everything?
                  </p>
                  <p className="text-xs text-black/50 font-medium mb-3">
                    This will permanently delete all {capsuleCount} capsule{capsuleCount !== 1 ? "s" : ""}. Consider exporting a backup first.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 bg-white border-[2px] border-black/40 rounded-lg text-xs font-bold uppercase tracking-wide text-black/60 hover:bg-white/80 transition-colors"
                    >
                      Never mind
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-3 py-1.5 bg-[#d4183d] border-[2px] border-[#a01030] rounded-lg text-xs font-bold uppercase tracking-wide text-white hover:bg-[#b8152f] transition-colors"
                    >
                      Yes, erase all
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </SettingsSection>

          {/* --- APPEARANCE SECTION --- */}
          <SettingsSection label="Appearance" icon={<Sun className="w-4 h-4" strokeWidth={2.5} />}>
            <p className="text-xs text-black/45 font-medium mb-4">
              Control how much visual flair the app uses.
            </p>
            <div className="flex gap-2.5">
              <ThemeOption
                active={settings.theme === "calm"}
                icon={<Sun className="w-5 h-5" strokeWidth={2} />}
                label="Calm"
                sublabel="Fewer sparkles"
                onClick={() => handleThemeChange("calm")}
              />
              <ThemeOption
                active={settings.theme === "expressive"}
                icon={<Zap className="w-5 h-5" strokeWidth={2} />}
                label="Expressive"
                sublabel="All the sparkles"
                onClick={() => handleThemeChange("expressive")}
              />
            </div>
          </SettingsSection>

          {/* --- ABOUT SECTION --- */}
          <SettingsSection label="About" icon={<Info className="w-4 h-4" strokeWidth={2.5} />} last>
            <div className="text-sm text-black/60 font-medium leading-relaxed space-y-2">
              <p>
                <span className="font-bold text-black/80">Memory Capsule</span> is a personal time capsule app. Write messages to your future self, seal them with a date, and open them when the time comes.
              </p>
              <p className="text-xs text-black/40">
                v0.2 — Data synced securely via Supabase.
              </p>
            </div>
          </SettingsSection>

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2.5px] border-black/30">
            <RetroButton variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              Back
            </RetroButton>
          </div>
        </div>
      </RetroWindow>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <div className={`flex items-center gap-2.5 px-5 py-3 border-[2.5px] rounded-lg shadow-[var(--retro-shadow-selected)] font-bold text-sm ${
              toast.type === "success"
                ? "bg-gradient-to-r from-retro-green-from to-retro-green-to border-black text-black"
                : toast.type === "error"
                  ? "bg-[#FFF0F0] border-[#d4183d]/60 text-[#d4183d]"
                  : "bg-gradient-to-r from-retro-yellow-from to-retro-yellow-to border-black text-black"
            }`}>
              {toast.type === "success" && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
              {toast.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              {toast.type === "info" && <Info className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RetroPageBackground>
  );
}

// --- Sub-components ---

function SettingsSection({ label, icon, last, children }: {
  label: string;
  icon: React.ReactNode;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={last ? "mt-6" : "mt-6 pb-6 border-b-[2px] border-black/10"}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-white/60 border-[2px] border-black/30 rounded-md flex items-center justify-center text-black/50">
          {icon}
        </div>
        <h3 className="text-sm font-black text-black uppercase tracking-wide">{label}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingsButton({ icon, label, sublabel, onClick, disabled }: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/50 border-[2.5px] border-black/60 rounded-lg text-left hover:bg-white/80 hover:border-black/80 hover:shadow-[var(--retro-shadow-focus)] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/50 disabled:hover:border-black/60 disabled:hover:shadow-none"
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
    >
      <div className="shrink-0 text-black/50">{icon}</div>
      <div>
        <p className="text-xs font-bold text-black uppercase tracking-wide">{label}</p>
        <p className="text-[10px] font-medium text-black/40">{sublabel}</p>
      </div>
    </motion.button>
  );
}

function ThemeOption({ active, icon, label, sublabel, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-4 border-[2.5px] rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
        active
          ? "bg-gradient-to-b from-retro-yellow-from to-retro-yellow-to border-black shadow-[var(--retro-shadow-selected)]"
          : "bg-white/40 border-black/50 hover:bg-white/70 hover:border-black/70"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={active ? "text-black" : "text-black/50"}>{icon}</div>
      <div className={`text-xs font-bold ${active ? "text-black" : "text-black/60"}`}>{label}</div>
      <div className="text-[10px] font-medium text-black/40">{sublabel}</div>
    </motion.button>
  );
}
