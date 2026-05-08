import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Check, AlertTriangle, X, Loader2 } from "lucide-react";
import {
  checkLocalCapsules,
  migrateToBackend,
  clearLocalAfterMigration,
} from "../../lib/migration";
import { useAuth } from "../../lib/auth";
import RetroButton from "./retro/RetroButton";

export default function MigrationModal() {
  const { user } = useAuth();
  const [localCapsules] = useState(() => checkLocalCapsules());
  const [status, setStatus] = useState<
    "prompt" | "migrating" | "done" | "error" | "dismissed"
  >("prompt");
  const [result, setResult] = useState<{
    migrated: number;
    failed: number;
  } | null>(null);

  // Nothing to migrate or already dismissed
  if (!localCapsules || !user || status === "dismissed") return null;
  if (status === "done") return null;

  async function handleMigrate() {
    if (!user || !localCapsules) return;
    setStatus("migrating");

    try {
      const res = await migrateToBackend(localCapsules, user.id);
      setResult({ migrated: res.migrated, failed: res.failed });

      if (res.failed === 0) {
        clearLocalAfterMigration();
      }

      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function handleDismiss() {
    setStatus("dismissed");
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white border-[3px] border-black rounded-xl shadow-[var(--retro-shadow-selected)] max-w-sm w-full overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-b from-retro-titlebar-from to-retro-titlebar-to border-b-[2.5px] border-black">
            <span className="text-xs font-black text-black/70 uppercase tracking-wide">
              Local Data Found
            </span>
            <button
              onClick={handleDismiss}
              className="text-black/40 hover:text-black/70 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-6 text-center">
            {status === "prompt" && (
              <>
                <div className="mx-auto mb-4 w-14 h-14 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[2.5px] border-black rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-black" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-bold text-black mb-1">
                  Found {localCapsules.length} capsule
                  {localCapsules.length !== 1 ? "s" : ""} saved locally
                </p>
                <p className="text-xs text-black/50 font-medium mb-5">
                  Import them to your account so they're available on any
                  device?
                </p>
                <div className="flex gap-2 justify-center">
                  <RetroButton variant="ghost" onClick={handleDismiss}>
                    Skip
                  </RetroButton>
                  <RetroButton onClick={handleMigrate}>
                    Import All
                  </RetroButton>
                </div>
              </>
            )}

            {status === "migrating" && (
              <>
                <Loader2
                  className="w-8 h-8 text-black/30 mx-auto mb-3 animate-spin"
                  strokeWidth={2.5}
                />
                <p className="text-sm font-bold text-black/60">
                  Importing capsules...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto mb-4 w-14 h-14 bg-[#FFF0F0] border-[2.5px] border-[#d4183d]/40 rounded-full flex items-center justify-center">
                  <AlertTriangle
                    className="w-6 h-6 text-[#d4183d]"
                    strokeWidth={2.5}
                  />
                </div>
                <p className="text-sm font-bold text-black mb-1">
                  Something went wrong
                </p>
                <p className="text-xs text-black/50 font-medium mb-5">
                  Your local data is still safe. Try again later.
                </p>
                <RetroButton variant="ghost" onClick={handleDismiss}>
                  Close
                </RetroButton>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline toast shown briefly after successful migration.
 * Used in the parent layout rather than in the modal itself.
 */
export function MigrationSuccessToast({
  migrated,
  onDone,
}: {
  migrated: number;
  onDone: () => void;
}) {
  return (
    <motion.div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      onAnimationComplete={() => {
        setTimeout(onDone, 3000);
      }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3 border-[2.5px] rounded-lg shadow-[var(--retro-shadow-selected)] font-bold text-sm bg-gradient-to-r from-retro-green-from to-retro-green-to border-black text-black">
        <Check className="w-4 h-4 shrink-0" strokeWidth={3} />
        <span>
          Imported {migrated} capsule{migrated !== 1 ? "s" : ""} to your account
        </span>
      </div>
    </motion.div>
  );
}
