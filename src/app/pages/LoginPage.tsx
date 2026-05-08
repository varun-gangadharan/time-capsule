import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Sparkles, Check, Loader2 } from "lucide-react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const { signInWithMagicLink, signInWithGoogle } = useAuth();

  // Already logged in — redirect
  if (authLoading) {
    return (
      <RetroPageBackground sparkleCount={4}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-black/30" strokeWidth={2.5} />
          </motion.div>
        </div>
      </RetroPageBackground>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    setErrorMsg("");
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error.message);
    }
  }

  // --- Magic link sent confirmation ---
  if (status === "sent") {
    return (
      <RetroPageBackground sparkleCount={8}>
        <RetroWindow title="CHECK YOUR INBOX" maxWidth="max-w-md">
          <div className="px-6 py-10 sm:px-10 sm:py-14 text-center">
            <motion.div
              className="mx-auto mb-8 w-20 h-20 bg-gradient-to-br from-retro-green-from to-retro-green-to border-[3px] border-black rounded-full flex items-center justify-center shadow-[var(--retro-shadow-selected)]"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Check
                className="w-10 h-10 text-black"
                strokeWidth={3}
              />
            </motion.div>

            <SectionHeader
              title="MAGIC LINK SENT"
              subtitle={`We sent a sign-in link to ${email}. Click it to continue.`}
              size="md"
            />

            <p className="text-xs text-black/40 font-medium mt-4">
              Check your spam folder if you don't see it within a minute.
            </p>

            <div className="mt-6">
              <RetroButton
                variant="ghost"
                onClick={() => {
                  setStatus("idle");
                  setEmail("");
                }}
              >
                Try a different email
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- Login form ---
  return (
    <RetroPageBackground sparkleCount={8}>
      <RetroWindow title="SIGN IN" maxWidth="max-w-md">
        <div className="px-6 py-8 sm:px-10 sm:py-12">
          {/* Hero icon */}
          <motion.div
            className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[3px] border-black rounded-full flex items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-8 h-8 text-black" strokeWidth={2.5} />
          </motion.div>

          <SectionHeader
            title="MEMORY CAPSULE"
            subtitle="Sign in to write messages to your future self."
            size="md"
          />

          {/* Magic link form */}
          <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="retro-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <motion.p
                className="text-xs font-bold text-[#d4183d]"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errorMsg}
              </motion.p>
            )}

            <RetroButton
              onClick={() => {}}
              // Using the form's onSubmit instead
            >
              {status === "sending" ? (
                <>
                  <Loader2
                    className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin"
                    strokeWidth={2.5}
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Mail
                    className="w-4 h-4 inline-block mr-1.5 mb-0.5"
                    strokeWidth={2.5}
                  />
                  Send Magic Link
                </>
              )}
            </RetroButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t-[2px] border-black/10" />
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 border-t-[2px] border-black/10" />
          </div>

          {/* Google OAuth */}
          <RetroButton variant="secondary" onClick={handleGoogle}>
            <svg className="w-4 h-4 inline-block mr-1.5 mb-0.5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </RetroButton>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}
