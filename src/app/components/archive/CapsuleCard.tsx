import { motion } from "motion/react";
import { useState } from "react";
import { Clock, Sparkles, Pencil, Eye, FileText, Mail, Trash2, Loader2, X, Check } from "lucide-react";
import { useNavigate } from "react-router";
import type { Capsule } from "../../../lib/capsules";
import { todayString } from "../../../lib/capsules";

const STATUS_CONFIG = {
  draft: { label: "DRAFT", bg: "bg-white/60", text: "text-black/50" },
  ready: { label: "READY TO OPEN", bg: "bg-gradient-to-r from-retro-yellow-from to-retro-yellow-to", text: "text-black" },
  sealed: { label: "SEALED", bg: "bg-gradient-to-r from-retro-green-from to-retro-green-to", text: "text-black" },
  opened: { label: "OPENED", bg: "bg-gradient-to-r from-retro-pink-from to-retro-pink-to", text: "text-black" },
  sent: { label: "SENT", bg: "bg-gradient-to-r from-retro-pink-from to-retro-pink-to", text: "text-black" },
} as const;

export default function CapsuleCard({
  capsule,
  index,
  onDelete,
}: {
  capsule: Capsule;
  index: number;
  onDelete?: (capsule: Capsule) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const openDate = capsule.openDate ? new Date(capsule.openDate + "T00:00:00") : null;
  const isDraft = capsule.status === "draft";
  const isOpened = capsule.status === "opened";
  const isSent = !!capsule.sharedWithEmail;
  const isReady = openDate ? capsule.openDate <= todayString() && capsule.status === "sealed" : false;

  const status = isDraft ? STATUS_CONFIG.draft : isSent ? STATUS_CONFIG.sent : isOpened ? STATUS_CONFIG.opened : isReady ? STATUS_CONFIG.ready : STATUS_CONFIG.sealed;

  // Completion hints for drafts
  const draftMissing: string[] = [];
  if (isDraft) {
    if (!capsule.title || capsule.title === "Untitled Capsule") draftMissing.push("title");
    if (!capsule.message) draftMissing.push("message");
    if (!capsule.openDate) draftMissing.push("open date");
  }

  // Updated date (fallback to createdAt for older capsules)
  const updatedDate = new Date(capsule.updatedAt || capsule.createdAt);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDelete || deleting) return;

    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await onDelete(capsule);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmingDelete(false);
  }

  // Draft card — loose note aesthetic
  if (isDraft) {
    return (
      <motion.div
        className="bg-[#FFFDF8]/70 border-[2px] border-dashed border-black/40 rounded-lg p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all cursor-pointer"
        style={{ rotate: index % 3 === 1 ? -0.4 : index % 3 === 2 ? 0.3 : 0 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ backgroundColor: "rgba(255,253,248,0.95)", boxShadow: "var(--retro-shadow-focus)", y: -1 }}
        transition={{ delay: index * 0.08 }}
        onClick={() => navigate(`/compose/${capsule.id}`)}
      >
        {/* Draft icon */}
        <div className="shrink-0 w-10 h-10 rounded-lg border-[2px] border-dashed border-black/30 bg-white/50 flex items-center justify-center">
          <FileText className="w-5 h-5 text-black/40" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-black/70 text-base truncate">
              {capsule.title === "Untitled Capsule" ? (
                <span className="italic text-black/40">Untitled Capsule</span>
              ) : capsule.title}
            </h3>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-dashed border-black/30 ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>

          <p className="text-sm text-black/50 font-medium truncate mb-2">
            {capsule.message || "A draft waiting to become something..."}
          </p>

          <div className="flex items-center gap-3 text-xs text-black/40 font-medium">
            <span>
              Updated {updatedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            {draftMissing.length > 0 && (
              <>
                <span>·</span>
                <span className="text-black/35 italic">
                  Still needs {draftMissing.join(", ")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <DeleteButton
            confirming={confirmingDelete}
            deleting={deleting}
            onDelete={handleDelete}
            onCancel={handleCancelDelete}
          />
          <motion.div
            className="px-3 py-1.5 bg-white/80 border-[2px] border-black/50 rounded-lg font-bold text-xs uppercase tracking-wide text-black/60 flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Pencil className="w-3 h-3" strokeWidth={2.5} />
            Continue
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Sealed / Ready / Opened card
  const iconBg = isOpened
    ? "bg-gradient-to-br from-retro-pink-from to-retro-pink-to"
    : isSent
      ? "bg-gradient-to-br from-retro-pink-from to-retro-pink-to"
    : isReady
      ? "bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to"
      : "bg-gradient-to-br from-retro-green-from to-retro-green-to";

  return (
    <motion.div
      className="bg-white/40 border-[2.5px] border-black/70 rounded-lg p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all cursor-pointer"
      style={{ rotate: index % 3 === 1 ? -0.3 : index % 3 === 2 ? 0.4 : 0 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.6)", boxShadow: "var(--retro-shadow-focus)", y: -1 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => {
        if (!isSent) navigate(`/capsules/${capsule.id}`);
      }}
    >
      {/* Status icon */}
      <div className={`shrink-0 w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center ${iconBg}`}>
        {isSent ? (
          <Mail className="w-5 h-5 text-black" strokeWidth={2.5} />
        ) : isReady ? (
          <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
        ) : isOpened ? (
          <Eye className="w-5 h-5 text-black" strokeWidth={2.5} />
        ) : (
          <Clock className="w-5 h-5 text-black/60" strokeWidth={2.5} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-black text-base truncate">
            {capsule.title}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/30 ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {isSent && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/20 bg-[#E8F0FF]/60 text-black/50 flex items-center gap-1">
              <Mail className="w-3 h-3" strokeWidth={2.5} />
              Recipient
            </span>
          )}
        </div>

        <p className="text-sm text-black/60 font-medium truncate mb-2">
          {isSent ? `Sent to ${capsule.sharedWithEmail}` : isOpened ? capsule.message : "Sealed — contents hidden"}
        </p>

        <div className="flex items-center gap-4 text-xs text-black/45 font-medium">
          <span>
            Created {new Date(capsule.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span>·</span>
          <span>
            {!openDate
              ? "No open date"
              : isReady || isOpened
                ? `Opened ${openDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : `Opens ${openDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
        </div>

        {capsule.tags && capsule.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {capsule.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-retro-page/50 border border-black/20 rounded-full text-[10px] font-bold text-black/50 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {capsule.mood && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-[#FFE8F5]/50 border border-black/20 rounded-full text-[10px] font-bold text-black/50 uppercase">
            {capsule.mood}
          </span>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <DeleteButton
          confirming={confirmingDelete}
          deleting={deleting}
          onDelete={handleDelete}
          onCancel={handleCancelDelete}
        />
        {isSent && (
          <motion.div
            className="px-3 py-1.5 bg-white/60 border-[2px] border-black/50 rounded-lg font-bold text-xs uppercase tracking-wide text-black/60 flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Mail className="w-3 h-3" strokeWidth={2.5} />
            Sent
          </motion.div>
        )}
        {!isSent && isReady && (
          <motion.div
            className="px-3 py-1.5 bg-gradient-to-b from-retro-yellow-from to-retro-yellow-to border-[2px] border-black/80 rounded-lg font-bold text-xs uppercase tracking-wide text-black flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Open
          </motion.div>
        )}
        {!isSent && isOpened && (
          <motion.div
            className="px-3 py-1.5 bg-white/60 border-[2px] border-black/50 rounded-lg font-bold text-xs uppercase tracking-wide text-black/60 flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Eye className="w-3 h-3" strokeWidth={2.5} />
            View
          </motion.div>
        )}
        {!isSent && !isReady && !isOpened && (
          <motion.div
            className="px-3 py-1.5 bg-white/60 border-[2px] border-black/50 rounded-lg font-bold text-xs uppercase tracking-wide text-black/60 flex items-center gap-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Clock className="w-3 h-3" strokeWidth={2.5} />
            Peek
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function DeleteButton({
  confirming,
  deleting,
  onDelete,
  onCancel,
}: {
  confirming: boolean;
  deleting: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
}) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 bg-white/70 border-[2px] border-black/35 rounded-md text-black/45 hover:text-black/70 hover:bg-white transition-all"
          aria-label="Cancel delete"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 bg-[#d4183d] border-[2px] border-[#a01030] rounded-md text-white hover:bg-[#b8152f] transition-all disabled:opacity-60"
          aria-label="Confirm delete"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
          ) : (
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="p-1.5 bg-white/50 border-[2px] border-black/30 rounded-md text-black/30 hover:text-[#d4183d] hover:border-[#d4183d]/50 hover:bg-[#FFF0F0] transition-all"
      aria-label="Delete capsule"
    >
      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  );
}
