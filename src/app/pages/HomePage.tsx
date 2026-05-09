import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Sparkles, Archive, Settings, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import StickerLabel from "../components/retro/StickerLabel";
import SectionHeader from "../components/retro/SectionHeader";
import { useAuth } from "../../lib/auth";
import { getAllCapsules } from "../../lib/capsules";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getAllCapsules()
      .then((capsules) => {
        setReceivedCount(capsules.filter((c) => c.userId !== user.id).length);
      })
      .catch(() => {});
  }, [user]);

  return (
    <RetroPageBackground sparkleCount={8}>
      <RetroWindow title="SEALED MEMORY INTERFACE" maxWidth="max-w-2xl">
        <div className="relative px-6 py-8 sm:px-14 sm:py-14 text-center">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="absolute right-4 top-4 p-2 rounded-lg border-[2px] border-black/20 bg-white/25 text-black/30 transition-all hover:bg-white/55 hover:text-black/60 hover:border-black/35"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Hero capsule illustration */}
          <motion.div
            className="mb-10 mx-auto w-40 h-40 sm:w-56 sm:h-56 relative"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Floating shadow underneath */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-black/15 rounded-full blur-md"
              animate={{ scale: [1, 0.9, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Soft glow */}
            <motion.div
              className="absolute inset-10 bg-gradient-to-br from-cyan-300/25 via-purple-300/20 to-pink-300/25 blur-2xl rounded-full"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Main capsule body */}
            <div className="relative w-full h-full">
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Left half */}
                <div className="absolute left-0 top-0 bottom-0 right-1/2 bg-gradient-to-br from-retro-green-from to-retro-green-to border-[3px] border-black rounded-l-full overflow-hidden">
                  <div className="absolute inset-4 border-2 border-black/10 rounded-l-full" />
                </div>

                {/* Right half */}
                <div className="absolute right-0 top-0 bottom-0 left-1/2 bg-gradient-to-br from-retro-pink-from to-retro-pink-to border-[3px] border-black rounded-r-full border-l-0 overflow-hidden">
                  <div className="absolute inset-4 border-2 border-black/10 rounded-r-full" />
                </div>

                {/* Center seam */}
                <div className="absolute left-1/2 top-3 bottom-3 w-[4px] bg-black transform -translate-x-1/2 rounded-full" />
                <div className="absolute left-1/2 top-3 bottom-3 w-[1.5px] bg-white/40 transform -translate-x-[4px] rounded-full" />

                {/* Hinges */}
                <div className="absolute left-1/2 top-6 w-3 h-3 bg-[#9B8AA4] border-[2px] border-black rounded-full transform -translate-x-1/2" />
                <div className="absolute left-1/2 bottom-6 w-3 h-3 bg-[#9B8AA4] border-[2px] border-black rounded-full transform -translate-x-1/2" />

                {/* Glossy highlight */}
                <motion.div
                  className="absolute top-10 left-14 w-14 h-10 bg-white/60 border-[2px] border-black/20 rounded-full blur-[2px]"
                  animate={{ opacity: [0.6, 0.8, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                {/* Core window */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[3px] border-black rounded-full flex items-center justify-center relative overflow-hidden"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="absolute inset-2 border-2 border-white/40 rounded-full" />
                    <Sparkles className="w-9 h-9 text-black relative z-10" strokeWidth={2.5} />
                  </motion.div>
                </div>

                {/* Latch */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-16">
                  <div className="relative">
                    <div className="w-10 h-4 bg-gradient-to-b from-[#D4A5A5] to-[#C89090] border-[2.5px] border-black rounded-md" />
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-white/35 rounded-t-md" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black/40 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sparkle particles */}
            {[...Array(5)].map((_, i) => {
              const angle = (i * 72) * (Math.PI / 180);
              const radius = 115;
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-yellow-300 border-[1.5px] border-black rounded-full"
                  style={{ left: "50%", top: "50%" }}
                  animate={{
                    x: [0, Math.cos(angle) * radius, 0],
                    y: [0, Math.sin(angle) * radius, 0],
                    opacity: [0, 0.9, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: "easeOut",
                  }}
                />
              );
            })}
          </motion.div>

          <SectionHeader
            title="MEMORY CAPSULE"
            subtitle="Write something to your future self. Seal it away. Open it when the time comes."
            size="lg"
          />

          {receivedCount > 0 && (
            <motion.button
              onClick={() => navigate("/archive", { state: { filter: "received" } })}
              className="mb-6 w-full bg-gradient-to-r from-retro-yellow-from/50 to-retro-pink-from/40 border-[2.5px] border-black/50 rounded-xl px-5 py-3.5 flex items-center justify-center gap-2.5 hover:border-black/70 transition-all"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Mail className="w-4 h-4 text-black/70" strokeWidth={2.5} />
              <span className="text-sm font-bold text-black/70">
                You have {receivedCount} received capsule{receivedCount !== 1 ? "s" : ""}
              </span>
              <ArrowRight className="w-4 h-4 text-black/50" strokeWidth={2.5} />
            </motion.button>
          )}

          <div className="mb-8">
            <RetroButton onClick={() => navigate("/compose")}>
              Write a Capsule →
            </RetroButton>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            <StickerLabel
              icon={<Lock strokeWidth={2.5} />}
              label="Private & Secure"
              bgClass="bg-[#FFE8F5]/50"
            />
            <StickerLabel
              icon={<Sparkles strokeWidth={2.5} />}
              label="Animated Reveal"
              bgClass="bg-[#FFF9E0]/50"
            />
            <StickerLabel
              icon={<Mail strokeWidth={2.5} />}
              label="Letters to Future You"
              bgClass="bg-[#E0F7FF]/50"
            />
          </div>

          {/* Archive link */}
          <div className="mt-8 pt-6 border-t-[2px] border-black/10">
            <button
              onClick={() => navigate("/archive")}
              className="text-xs font-bold text-black/45 hover:text-black/70 transition-colors uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" strokeWidth={2.5} />
              Open Archive
            </button>
          </div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}
