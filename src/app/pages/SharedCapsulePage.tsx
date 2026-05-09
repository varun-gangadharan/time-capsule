import { motion } from "motion/react";
import { Sparkles, Calendar, Clock, Lock, Tag, Loader2, Link2, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getShareInfo, getCapsuleByToken, openSharedCapsule, todayString } from "../../lib/capsules";
import type { Capsule, ShareInfo } from "../../lib/capsules";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";

type PageState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "verify"; shareInfo: ShareInfo }
  | { kind: "otp_sent"; email: string; shareInfo: ShareInfo }
  | { kind: "wrong_email"; shareInfo: ShareInfo }
  | { kind: "capsule"; capsule: Capsule };

export default function SharedCapsulePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [revealed, setRevealed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [openError, setOpenError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fetch share info, then try to load capsule if authenticated
  useEffect(() => {
    if (!token || authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        const info = await getShareInfo(token!);
        if (cancelled) return;

        if (!info.exists) {
          setState({ kind: "not_found" });
          return;
        }

        // If user is authenticated, try fetching the capsule (RLS checks email)
        if (user) {
          try {
            const capsule = await getCapsuleByToken(token!);
            if (cancelled) return;
            if (capsule) {
              setState({ kind: "capsule", capsule });
              return;
            }
          } catch {
            // RLS blocked — wrong email
          }
          // Authenticated but email doesn't match
          setState({ kind: "wrong_email", shareInfo: info });
          return;
        }

        // Not authenticated — need to verify
        setState({ kind: "verify", shareInfo: info });
      } catch {
        if (!cancelled) setState({ kind: "not_found" });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, user, authLoading]);

  async function handleSendOtp() {
    if (!email.trim()) return;
    setSendingOtp(true);
    setVerifyError("");
    try {
      if (state.kind === "wrong_email") {
        await supabase.auth.signOut();
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        setVerifyError(error.message);
        return;
      }
      if (state.kind === "verify" || state.kind === "wrong_email") {
        setState({ kind: "otp_sent", email: email.trim().toLowerCase(), shareInfo: state.shareInfo });
      }
    } catch (err) {
      setVerifyError("Failed to send verification code.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (state.kind !== "otp_sent" || !otpCode.trim()) return;
    setVerifyingOtp(true);
    setVerifyError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: state.email,
        token: otpCode.trim(),
        type: "email",
      });
      if (error) {
        setVerifyError("Invalid code. Please try again.");
        return;
      }
      // Auth state change will trigger the useEffect to reload
    } catch {
      setVerifyError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleOpen() {
    if (!token || state.kind !== "capsule") return;
    setOpening(true);
    setOpenError("");
    try {
      await openSharedCapsule(token);
      const updated = await getCapsuleByToken(token);
      if (updated) {
        setState({ kind: "capsule", capsule: updated });
        setRevealed(true);
      }
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "This capsule could not be opened yet.");
      setOpening(false);
    }
  }

  // --- LOADING ---
  if (state.kind === "loading") {
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

  // --- NOT FOUND ---
  if (state.kind === "not_found") {
    return (
      <RetroPageBackground sparkleCount={4}>
        <RetroWindow title="NOT FOUND" maxWidth="max-w-2xl">
          <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
            <motion.div
              className="mx-auto mb-6 w-20 h-20 bg-white/40 border-[3px] border-black/30 border-dashed rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <Link2 className="w-8 h-8 text-black/30" strokeWidth={2} />
            </motion.div>
            <SectionHeader
              title="LINK NOT FOUND"
              subtitle="This share link is invalid or has been revoked by the capsule owner."
              size="md"
            />
            <p className="text-sm text-black/40 font-medium mt-4">
              Want to create your own time capsule?
            </p>
            <div className="mt-4">
              <RetroButton onClick={() => window.location.href = "/"}>
                Create Your Own
                <ArrowRight className="w-4 h-4 inline-block ml-1.5 mb-0.5" strokeWidth={2.5} />
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- VERIFY EMAIL / WRONG EMAIL ---
  if (state.kind === "verify" || state.kind === "wrong_email") {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="SHARED CAPSULE" maxWidth="max-w-2xl">
          <SharedBanner />
          <div className="px-6 py-10 sm:px-14 sm:py-12 text-center">
            <motion.div
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-retro-pink-from to-retro-pink-to border-[3px] border-black rounded-full flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <ShieldCheck className="w-9 h-9 text-black" strokeWidth={2} />
            </motion.div>

            <SectionHeader
              title={`"${state.shareInfo.title}"`}
              subtitle="This capsule was shared with a specific person. Verify your email to view it."
              size="md"
            />

            <p className="text-sm text-black/50 font-medium mb-6">
              Shared with <span className="font-bold text-black/70">{state.shareInfo.email_hint}</span>
            </p>

            {state.kind === "wrong_email" && (
              <div className="bg-[#FFF3E0]/60 border-[2px] border-black/20 rounded-lg px-4 py-3 mb-4 text-sm text-black/60 font-medium">
                You're signed in with a different email. Enter the correct email below.
              </div>
            )}

            <div className="max-w-sm mx-auto space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="retro-input text-center"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />
              {verifyError && (
                <p className="text-xs text-red-600 font-bold">{verifyError}</p>
              )}
              <RetroButton onClick={handleSendOtp}>
                {sendingOtp ? (
                  <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Mail className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                )}
                Send Verification Code
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- OTP SENT ---
  if (state.kind === "otp_sent") {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="VERIFY EMAIL" maxWidth="max-w-2xl">
          <SharedBanner />
          <div className="px-6 py-10 sm:px-14 sm:py-12 text-center">
            <motion.div
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[3px] border-black rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <Mail className="w-9 h-9 text-black" strokeWidth={2} />
            </motion.div>

            <SectionHeader
              title="CHECK YOUR EMAIL"
              subtitle={`We sent a 6-digit code to ${state.email}`}
              size="md"
            />

            <div className="max-w-xs mx-auto space-y-3 mt-6">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="retro-input text-center text-2xl tracking-[0.3em] font-bold"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
              {verifyError && (
                <p className="text-xs text-red-600 font-bold">{verifyError}</p>
              )}
              <RetroButton onClick={handleVerifyOtp}>
                {verifyingOtp ? (
                  <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <ShieldCheck className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                )}
                Verify
              </RetroButton>

              <button
                onClick={() => {
                  setOtpCode("");
                  setVerifyError("");
                  setState({ kind: "verify", shareInfo: state.shareInfo });
                }}
                className="text-xs font-bold text-black/40 hover:text-black/60 uppercase tracking-wide transition-colors"
              >
                Use a different email
              </button>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- CAPSULE LOADED (state.kind === "capsule") ---
  const capsule = state.capsule;
  const openDateObj = new Date(capsule.openDate + "T00:00:00");
  const createdDate = new Date(capsule.createdAt);
  const isReady = capsule.openDate <= todayString() && capsule.status === "sealed";
  const isOpened = capsule.status === "opened";

  const formattedOpenDate = openDateObj.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const formattedCreatedDate = createdDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  // --- SEALED & LOCKED ---
  if (!isReady && !isOpened) {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="SHARED CAPSULE" maxWidth="max-w-2xl">
          <SharedBanner />
          <div className="p-6 sm:p-10">
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
                This capsule is still locked. Come back on {formattedOpenDate}.
              </p>
            </div>

            <CapsuleMetadata capsule={capsule} formattedCreatedDate={formattedCreatedDate} formattedOpenDate={formattedOpenDate} />

            <div className="bg-black/[0.03] border-[2.5px] border-black/20 border-dashed rounded-xl p-6 sm:p-8 text-center mb-8">
              <Lock className="w-5 h-5 text-black/25 mx-auto mb-2" strokeWidth={2.5} />
              <p className="text-sm text-black/35 font-bold uppercase tracking-wide">
                Message hidden until the unlock date
              </p>
            </div>

            <FooterCta />
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- READY TO OPEN ---
  if (!revealed && !isOpened) {
    return (
      <RetroPageBackground sparkleCount={12}>
        <RetroWindow title="SHARED CAPSULE" maxWidth="max-w-2xl">
          <SharedBanner />
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
              title="IT'S READY"
              subtitle={`"${capsule.title}" — sealed on ${formattedCreatedDate}`}
              size="md"
            />

            <p className="text-sm text-black/50 font-medium mb-8">
              Someone left a time capsule for you. Ready to see what's inside?
            </p>

            <RetroButton onClick={handleOpen}>
              {opening ? (
                <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <Sparkles className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              )}
              Open It
            </RetroButton>
            {openError && (
              <p className="text-xs text-red-600 font-bold mt-4">{openError}</p>
            )}
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- OPENED / REVEALED ---
  return (
    <RetroPageBackground sparkleCount={15}>
      <RetroWindow title="SHARED MEMORY" maxWidth="max-w-2xl">
        <SharedBanner />
        <div className="p-6 sm:p-10">
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
                  <span key={tag} className="px-2 py-0.5 bg-retro-page/50 border border-black/20 rounded-full text-[10px] font-bold text-black/50 uppercase">
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

          <motion.div
            className="text-center"
            initial={revealed ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: revealed ? 1 : 0 }}
          >
            <FooterCta />
          </motion.div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}

// --- Helper components ---

function SharedBanner() {
  return (
    <div className="bg-gradient-to-r from-retro-pink-from/30 to-retro-mint-from/30 border-b-[2.5px] border-black/15 px-5 py-3 flex items-center justify-center gap-2">
      <Link2 className="w-4 h-4 text-black/50" strokeWidth={2.5} />
      <span className="text-xs font-bold text-black/60 uppercase tracking-wide">
        Someone shared a time capsule with you
      </span>
    </div>
  );
}

function FooterCta() {
  return (
    <div className="text-center">
      <p className="text-xs text-black/35 font-medium mb-2">
        Want to send your own time capsule?
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black/70 uppercase tracking-wide transition-colors"
      >
        Create one here
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </a>
    </div>
  );
}

function CapsuleMetadata({ capsule, formattedCreatedDate, formattedOpenDate }: {
  capsule: Capsule;
  formattedCreatedDate: string;
  formattedOpenDate: string;
}) {
  return (
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
              <span key={tag} className="px-2.5 py-1 bg-retro-page/60 border border-black/20 rounded-full text-[11px] font-bold text-black/60 uppercase">
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
