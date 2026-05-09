import { motion } from "motion/react";
import { HelpCircle, Home, Archive } from "lucide-react";
import { useNavigate } from "react-router";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import SectionHeader from "../components/retro/SectionHeader";
import RetroButton from "../components/retro/RetroButton";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <RetroPageBackground sparkleCount={4}>
      <RetroWindow title="PAGE NOT FOUND" maxWidth="max-w-2xl">
        <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
          <motion.div
            className="mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-retro-page to-retro-titlebar-to border-[3px] border-black/40 border-dashed rounded-full flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-black/30" strokeWidth={2} />
          </motion.div>

          <SectionHeader
            title="LOST IN TIME"
            subtitle="This page doesn't exist. Maybe it was sealed away somewhere else."
            size="md"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
            <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
              <Archive className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              Archive
            </RetroButton>
            <RetroButton onClick={() => navigate("/")}>
              <Home className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
              Go Home
            </RetroButton>
          </div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}
