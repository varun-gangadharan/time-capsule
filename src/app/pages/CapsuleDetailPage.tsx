import { motion } from "motion/react";
import { Sparkles, ArrowLeft, Calendar, Clock, Lock, Tag, Loader2, Mail, X, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { getCapsule, openCapsule, shareCapsuleWithEmail, revokeShare, todayString } from "../../lib/capsules";
import type { Capsule } from "../../lib/capsules";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";

export default function CapsuleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [capsule, setCapsule] = useState<Capsule | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    getCapsule(id)
      .then((c) => {
        if (cancelled) return;
        setCapsule(c);
        if (c?.status === "draft") {
          navigate(`/compose/${c.id}`, { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, navigate]);

  // Loading
  if (loading) {
    return (
      <RetroPageBackground sparkleCount={4}>
        <RetroWindow title="LOADING..." maxWidth="max-w-2xl">
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

  // Not found
  if (!capsule || capsule.status === "draft") {
    return (
      <RetroPageBackground sparkleCount={4}>
        <RetroWindow title="NOT FOUND" maxWidth="max-w-2xl">
          <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
            <SectionHeader
              title="LOST IN TIME"
              subtitle="This capsule doesn't seem to exist. It may have been removed, or the link is wrong."
              size="md"
            />
            <RetroButton onClick={() => navigate("/archive")}>
              Back to Archive
            </RetroButton>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  async function handleShareWithEmail() {
    if (!capsule) return;
    if (!shareEmail.trim()) {
      setShareMessage("Enter the recipient's email first.");
      return;
    }
    setSharingLoading(true);
    setShareMessage("");
    try {
      const recipientEmail = shareEmail.trim().toLowerCase();
      const result = await shareCapsuleWithEmail(capsule.id, recipientEmail);
      setCapsule({
        ...capsule,
        shareToken: result.token,
        isPrivate: false,
        sharedAt: new Date().toISOString(),
        sharedWithEmail: recipientEmail,
      });
      setShareEmail("");
      setShareMessage(
        result.emailSent
          ? `Invite sent to ${recipientEmail}.`
          : `Access was granted to ${recipientEmail}, but the invite email failed: ${result.emailError}`
      );
    } catch (err) {
      setShareMessage(err instanceof Error ? err.message : "Failed to share this capsule.");
    } finally {
      setSharingLoading(false);
    }
  }

  async function handleRevokeShare() {
    if (!capsule) return;
    setSharingLoading(true);
    setShareMessage("");
    try {
      await revokeShare(capsule.id);
      setCapsule({ ...capsule, shareToken: undefined, isPrivate: true, sharedAt: undefined, sharedWithEmail: undefined });
      setShareMessage("Sharing revoked.");
    } catch (err) {
      setShareMessage(err instanceof Error ? err.message : "Failed to revoke sharing.");
    } finally {
      setSharingLoading(false);
    }
  }

  const openDateObj = new Date(capsule.openDate + "T00:00:00");
  const createdDate = new Date(capsule.createdAt);
  const isReady = capsule.openDate <= todayString() && capsule.status === "sealed";
  const isOpened = capsule.status === "opened";
  const isSent = !!capsule.sharedWithEmail;

  const formattedOpenDate = openDateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedCreatedDate = createdDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleOpen() {
    if (!capsule || isSent) return;
    setOpening(true);
    try {
      await openCapsule(capsule.id);
      // Re-fetch the capsule to get the full message
      const updated = await getCapsule(capsule.id);
      if (updated) {
        setCapsule(updated);
      }
      setRevealed(true);
    } catch {
      // If server-side open fails, show error
      setOpening(false);
    }
  }

  if (isSent) {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="SENT CAPSULE" maxWidth="max-w-2xl">
          <div className="p-6 sm:p-10">
            <div className="text-center mb-8">
              <motion.div
                className="mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-retro-pink-from to-retro-pink-to border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[var(--retro-shadow-selected)] relative overflow-hidden"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-black relative z-10" strokeWidth={2} />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">
                {capsule.title}
              </h2>
              <p className="text-sm text-black/50 font-medium">
                Sent to <span className="font-bold text-black/70">{capsule.sharedWithEmail}</span>.
              </p>
            </div>

            <div className="bg-white/40 border-[2.5px] border-black/50 border-dashed rounded-xl p-5 sm:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetadataRow
                  icon={<Calendar className="w-4 h-4" strokeWidth={2.5} />}
                  label="Sealed on"
                  value={formattedCreatedDate}
                />
                <MetadataRow
                  icon={<Clock className="w-4 h-4" strokeWidth={2.5} />}
                  label={isOpened ? "Recipient opened" : "Recipient can open"}
                  value={formattedOpenDate}
                />
              </div>
            </div>

            <div className="bg-black/[0.03] border-[2.5px] border-black/20 border-dashed rounded-xl p-6 sm:p-8 text-center mb-8">
              <Lock className="w-5 h-5 text-black/25 mx-auto mb-2" strokeWidth={2.5} />
              <p className="text-sm text-black/35 font-bold uppercase tracking-wide">
                Contents are only visible to the verified recipient
              </p>
            </div>

            <ShareSection
              capsule={capsule}
              sharingLoading={sharingLoading}
              shareEmail={shareEmail}
              shareMessage={shareMessage}
              onEmailChange={setShareEmail}
              onShare={handleShareWithEmail}
              onRevoke={handleRevokeShare}
            />

            <div className="flex items-center justify-center">
              <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
                <ArrowLeft className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                Back to Archive
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- STATE: Sealed & locked (future date) ---
  if (!isReady && !isOpened) {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="SEALED CAPSULE" maxWidth="max-w-2xl">
          <div className="p-6 sm:p-10">
            {/* Locked icon */}
            <div className="text-center mb-8">
              <motion.div
                className="mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-retro-green-from to-retro-green-to border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[var(--retro-shadow-selected)] relative overflow-hidden"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, black 2px, black 3px)",
                }} />
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-black relative z-10" strokeWidth={2} />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">
                {capsule.title}
              </h2>
              <p className="text-sm text-black/50 font-medium">
                Still locked until {formattedOpenDate}.
              </p>
            </div>

            {/* Metadata card */}
            <div className="bg-white/40 border-[2.5px] border-black/50 border-dashed rounded-xl p-5 sm:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetadataRow
                  icon={<Calendar className="w-4 h-4" strokeWidth={2.5} />}
                  label="Sealed on"
                  value={formattedCreatedDate}
                />
                <MetadataRow
                  icon={<Clock className="w-4 h-4" strokeWidth={2.5} />}
                  label="Unlocks on"
                  value={formattedOpenDate}
                />
              </div>

              {capsule.tags && capsule.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3.5 h-3.5 text-black/40" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-black/40 uppercase tracking-wide">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {capsule.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-retro-page/60 border border-black/20 rounded-full text-[11px] font-bold text-black/60 uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {capsule.mood && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <span className="px-2.5 py-1 bg-[#FFE8F5]/60 border border-black/20 rounded-full text-[11px] font-bold text-black/60 uppercase">
                    {capsule.mood}
                  </span>
                </div>
              )}
            </div>

            {/* Message placeholder */}
            <div className="bg-black/[0.03] border-[2.5px] border-black/20 border-dashed rounded-xl p-6 sm:p-8 text-center mb-8">
              <Lock className="w-5 h-5 text-black/25 mx-auto mb-2" strokeWidth={2.5} />
              <p className="text-sm text-black/35 font-bold uppercase tracking-wide">
                Your words are safe in here
              </p>
            </div>

            {/* Share section */}
            <ShareSection
              capsule={capsule}
              sharingLoading={sharingLoading}
              shareEmail={shareEmail}
              shareMessage={shareMessage}
              onEmailChange={setShareEmail}
              onShare={handleShareWithEmail}
              onRevoke={handleRevokeShare}
            />

            {/* Nav */}
            <div className="flex items-center justify-center">
              <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
                <ArrowLeft className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                Back to Archive
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- STATE: Ready to open (CTA) ---
  if (!revealed && !isOpened) {
    return (
      <RetroPageBackground sparkleCount={12}>
        <RetroWindow title="READY TO OPEN" maxWidth="max-w-2xl">
          <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
            <motion.div
              className="mx-auto mb-8 w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[var(--retro-shadow-selected)] relative overflow-hidden"
              animate={{ scale: [1, 1.04, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-white/30 rounded-2xl"
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-black relative z-10" strokeWidth={2} />
            </motion.div>

            <SectionHeader
              title="IT'S TIME"
              subtitle={`"${capsule.title}" — sealed on ${formattedCreatedDate}`}
              size="md"
            />

            <p className="text-sm text-black/50 font-medium mb-8">
              Past you left something in here. Ready to see what it was?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <RetroButton variant="ghost" onClick={() => navigate("/archive")}>
                <ArrowLeft className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                Not Yet
              </RetroButton>
              <RetroButton onClick={handleOpen}>
                {opening ? (
                  <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Sparkles className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                )}
                Open It
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- STATE: Opened / Revealed ---
  return (
    <RetroPageBackground sparkleCount={15}>
      <RetroWindow title="OPENED MEMORY" maxWidth="max-w-2xl">
        <div className="p-6 sm:p-10">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={revealed ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mx-auto mb-5 w-16 h-16 bg-gradient-to-br from-retro-pink-from to-retro-pink-to border-[3px] border-black rounded-full flex items-center justify-center"
              initial={revealed ? { scale: 0, rotate: -180 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8, delay: revealed ? 0.2 : 0 }}
            >
              <Sparkles className="w-7 h-7 text-black" strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {capsule.title}
            </h2>
          </motion.div>

          {/* Message body */}
          <motion.div
            className="bg-white/50 border-[2.5px] border-black/60 rounded-xl p-6 sm:p-8 mb-6"
            initial={revealed ? { opacity: 0, y: 20, scale: 0.95 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: revealed ? 0.4 : 0 }}
          >
            <p className="text-base sm:text-lg text-black/80 font-medium leading-relaxed whitespace-pre-wrap">
              {capsule.message}
            </p>
          </motion.div>

          {/* Metadata */}
          <motion.div
            className="bg-white/30 border-[2px] border-black/20 rounded-lg p-4 mb-8"
            initial={revealed ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: revealed ? 0.7 : 0 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-black/50 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} />
                Sealed {formattedCreatedDate}
              </span>
              <span className="text-black/20">·</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                Opened {formattedOpenDate}
              </span>
            </div>

            {((capsule.tags && capsule.tags.length > 0) || capsule.mood) && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-black/10">
                {capsule.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-retro-page/50 border border-black/20 rounded-full text-[10px] font-bold text-black/50 uppercase"
                  >
                    {tag}
                  </span>
                ))}
                {capsule.mood && (
                  <span className="px-2 py-0.5 bg-[#FFE8F5]/50 border border-black/20 rounded-full text-[10px] font-bold text-black/50 uppercase">
                    {capsule.mood}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Share section */}
          <motion.div
            initial={revealed ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: revealed ? 0.85 : 0 }}
          >
            <ShareSection
              capsule={capsule}
              sharingLoading={sharingLoading}
              shareEmail={shareEmail}
              shareMessage={shareMessage}
              onEmailChange={setShareEmail}
              onShare={handleShareWithEmail}
              onRevoke={handleRevokeShare}
            />
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={revealed ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: revealed ? 1 : 0 }}
          >
            <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
              <ArrowLeft className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              Back to Archive
            </RetroButton>
            <RetroButton onClick={() => navigate("/compose")}>
              Write Another →
            </RetroButton>
          </motion.div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}

function ShareSection({
  capsule,
  sharingLoading,
  shareEmail,
  shareMessage,
  onEmailChange,
  onShare,
  onRevoke,
}: {
  capsule: Capsule;
  sharingLoading: boolean;
  shareEmail: string;
  shareMessage: string;
  onEmailChange: (email: string) => void;
  onShare: () => void;
  onRevoke: () => void;
}) {
  const isShared = !!capsule.shareToken;
  const formattedOpenDate = new Date(capsule.openDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="bg-white/30 border-[2px] border-black/20 border-dashed rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-black/50" strokeWidth={2.5} />
        <span className="text-xs font-bold text-black/60 uppercase tracking-wide">Share</span>
      </div>

      {!isShared ? (
        <div className="py-2">
          <p className="text-sm text-black/50 font-medium mb-3">
            Send this capsule to one recipient. They must verify this email before they can view it.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="recipient@example.com"
              className="retro-input text-sm flex-1 !py-2 bg-white/60"
              value={shareEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onShare()}
            />
            <RetroButton variant="ghost" onClick={onShare} disabled={sharingLoading}>
              {sharingLoading ? (
                <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <Send className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              )}
              Send Invite
            </RetroButton>
          </div>
          {shareMessage && (
            <p className="text-[11px] text-black/45 font-medium mt-2">{shareMessage}</p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-black/55 font-medium mb-2">
            Shared with <span className="font-bold text-black/75">{capsule.sharedWithEmail}</span>
          </p>
          <p className="text-[11px] text-black/40 font-medium mb-3">
            Only that verified email can view this capsule after {formattedOpenDate}.
          </p>
          {shareMessage && (
            <p className="text-[11px] text-black/45 font-medium mb-3">{shareMessage}</p>
          )}

          <button
            onClick={onRevoke}
            className="flex items-center gap-1.5 text-xs font-bold text-black/40 hover:text-black/60 uppercase tracking-wide transition-colors"
          >
            {sharingLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            Revoke Access
          </button>
        </div>
      )}
    </div>
  );
}

function MetadataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-8 h-8 bg-white/60 border-[2px] border-black/30 rounded-lg flex items-center justify-center text-black/50">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-black/80">{value}</p>
      </div>
    </div>
  );
}
