import { motion } from "motion/react";
import { Archive, Clock, Sparkles, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { getAllCapsules, type Capsule } from "../../lib/capsules";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";

export default function ArchivePage() {
  const navigate = useNavigate();
  const capsules = getAllCapsules().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <RetroPageBackground sparkleCount={5}>
      <RetroWindow title="MEMORY ARCHIVE v1.0" maxWidth="max-w-4xl">
        <div className="p-10">
          <SectionHeader
            title="YOUR ARCHIVE"
            subtitle="All your sealed memories, waiting for their moment."
            size="md"
          />

          {capsules.length === 0 ? <EmptyState /> : (
            <div className="space-y-4">
              {capsules.map((capsule, i) => (
                <CapsuleCard key={capsule.id} capsule={capsule} index={i} />
              ))}
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2.5px] border-black/20">
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

function EmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Empty archive illustration */}
      <motion.div
        className="mx-auto mb-6 w-28 h-28 relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-retro-page to-retro-titlebar-to border-[2.5px] border-black/40 rounded-xl border-dashed flex items-center justify-center">
          <Archive className="w-10 h-10 text-black/25" strokeWidth={2} />
        </div>
        {/* Tiny floating sparkles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-retro-yellow-to border border-black/30 rounded-full"
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{ y: [0, -8, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}
      </motion.div>

      <p className="text-lg font-bold text-black/70 mb-2">
        No capsules yet
      </p>
      <p className="text-sm text-black/50 font-medium mb-6 max-w-sm mx-auto">
        Your sealed memories will appear here. Create your first capsule and send a message to the future.
      </p>
      <RetroButton onClick={() => navigate("/compose")}>
        Create Your First Capsule →
      </RetroButton>
    </motion.div>
  );
}

function CapsuleCard({ capsule, index }: { capsule: Capsule; index: number }) {
  const openDate = new Date(capsule.openDate + "T00:00:00");
  const created = new Date(capsule.createdAt);
  const now = new Date();
  const isReady = openDate <= now && capsule.status === "sealed";
  const isDraft = capsule.status === "draft";

  const statusConfig = isDraft
    ? { label: "DRAFT", bg: "bg-white/60", text: "text-black/50" }
    : isReady
    ? { label: "READY TO OPEN", bg: "bg-gradient-to-r from-retro-yellow-from to-retro-yellow-to", text: "text-black" }
    : { label: "SEALED", bg: "bg-gradient-to-r from-retro-green-from to-retro-green-to", text: "text-black" };

  return (
    <motion.div
      className="bg-white/40 border-[2.5px] border-black/70 rounded-lg p-5 flex items-start gap-4 hover:bg-white/60 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      {/* Status icon */}
      <div className={`shrink-0 w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center ${
        isDraft ? "bg-white/50" : isReady ? "bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to" : "bg-gradient-to-br from-retro-green-from to-retro-green-to"
      }`}>
        {isReady ? (
          <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
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
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/30 ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>

        <p className="text-sm text-black/60 font-medium truncate mb-2">
          {capsule.message}
        </p>

        <div className="flex items-center gap-4 text-xs text-black/45 font-medium">
          <span>
            Created {created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span>·</span>
          <span>
            {isDraft ? "No open date" : `Opens ${openDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
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
    </motion.div>
  );
}
