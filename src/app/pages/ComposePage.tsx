import { motion } from "motion/react";
import { Sparkles, Mail, Calendar, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";
import PaperPanel from "../components/retro/PaperPanel";
import VesselCard from "../components/compose/VesselCard";
import VesselPreview from "../components/compose/VesselPreview";
import type { VesselType } from "../components/compose/VesselCard";

export default function ComposePage() {
  const navigate = useNavigate();
  const [selectedVessel, setSelectedVessel] = useState<VesselType>("capsule");
  const [privacyMode, setPrivacyMode] = useState<"private" | "shareable">("private");

  return (
    <RetroPageBackground sparkleCount={6}>
      <RetroWindow title="CAPSULE COMPOSER v1.0" maxWidth="max-w-5xl">
        <div className="p-10">
          <SectionHeader
            title="CREATE A CAPSULE"
            subtitle="Write a message and send it as a private reveal experience."
            size="md"
          />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form inputs */}
            <div className="lg:col-span-2 space-y-5">
              <FormField label="To">
                <input
                  type="email"
                  placeholder="recipient@email.com"
                  className="retro-input"
                />
              </FormField>

              <FormField label="From">
                <input
                  type="text"
                  placeholder="Your name"
                  className="retro-input"
                />
              </FormField>

              <FormField label="Message Title">
                <input
                  type="text"
                  placeholder="Give your capsule a title"
                  className="retro-input"
                />
              </FormField>

              <FormField label="Your Message">
                <textarea
                  rows={6}
                  placeholder="Write something meaningful..."
                  className="retro-input resize-none"
                />
              </FormField>

              <FormField
                label="Unlock Date"
                optional
                hint="Leave blank to send immediately"
              >
                <div className="relative">
                  <input type="date" className="retro-input" />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 pointer-events-none"
                    strokeWidth={2.5}
                  />
                </div>
              </FormField>

              {/* Privacy Mode */}
              <div>
                <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                  Privacy Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrivacyMode("private")}
                    className={`flex-1 px-4 py-3 border-[2.5px] border-black/80 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                      privacyMode === "private"
                        ? "bg-gradient-to-b from-retro-green-from to-retro-green-to shadow-[var(--retro-shadow-selected)]"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  >
                    <Lock className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                    Private
                  </button>
                  <button
                    onClick={() => setPrivacyMode("shareable")}
                    className={`flex-1 px-4 py-3 border-[2.5px] border-black/80 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                      privacyMode === "shareable"
                        ? "bg-gradient-to-b from-retro-pink-from to-retro-pink-to shadow-[var(--retro-shadow-selected)]"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  >
                    <Mail className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                    Shareable Link
                  </button>
                </div>
              </div>

              {/* Vessel selector */}
              <div>
                <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                  Choose a Vessel
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <VesselCard type="capsule" selected={selectedVessel === "capsule"} onClick={() => setSelectedVessel("capsule")} />
                  <VesselCard type="envelope" selected={selectedVessel === "envelope"} onClick={() => setSelectedVessel("envelope")} />
                  <VesselCard type="constellation" selected={selectedVessel === "constellation"} onClick={() => setSelectedVessel("constellation")} />
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-1">
              <PaperPanel className="h-full min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-xs font-bold text-black/60 uppercase tracking-wider mb-4">
                  Preview
                </div>

                <VesselPreview vessel={selectedVessel} />

                <div className="mt-6 text-center">
                  <p className="text-xs text-black/70 font-medium leading-relaxed">
                    This is how your capsule will appear when sealed
                  </p>
                </div>

                {/* Floating sparkles in preview */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 border border-black rounded-full"
                    style={{
                      left: `${30 + Math.random() * 40}%`,
                      top: `${30 + Math.random() * 40}%`,
                    }}
                    animate={{ y: [0, -10, 0], opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
                  />
                ))}
              </PaperPanel>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2.5px] border-black/20">
            <RetroButton variant="ghost" onClick={() => navigate("/")}>
              Cancel
            </RetroButton>

            <div className="flex gap-3">
              <RetroButton variant="secondary">Save Draft</RetroButton>
              <RetroButton variant="primary" className="px-8 py-3 text-base">
                Preview Capsule →
              </RetroButton>
            </div>
          </div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}

/* ----- Local helper for form fields ----- */

function FormField({
  label,
  optional,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
        {label}
        {optional && <span className="text-black/50 text-xs ml-1">(Optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-black/50 mt-1 font-medium">{hint}</p>}
    </div>
  );
}
