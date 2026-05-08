import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { getAllCapsules } from "../../lib/capsules";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";
import CapsuleCard from "../components/archive/CapsuleCard";
import EmptyArchiveState from "../components/archive/EmptyArchiveState";

export default function ArchivePage() {
  const navigate = useNavigate();
  const capsules = getAllCapsules().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <RetroPageBackground sparkleCount={5}>
      <RetroWindow title="MEMORY ARCHIVE v1.0" maxWidth="max-w-4xl">
        <div className="p-5 sm:p-10">
          <SectionHeader
            title="YOUR ARCHIVE"
            subtitle="All your sealed memories, waiting for their moment."
            size="md"
          />

          {capsules.length === 0 ? <EmptyArchiveState /> : (
            <div className="space-y-4">
              {capsules.map((capsule, i) => (
                <CapsuleCard key={capsule.id} capsule={capsule} index={i} />
              ))}
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2.5px] border-black/30">
            <RetroButton variant="ghost" onClick={() => navigate("/")}>
              Home
            </RetroButton>
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
