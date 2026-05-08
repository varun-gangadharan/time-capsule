import { motion } from "motion/react";
import { Archive } from "lucide-react";
import { useNavigate } from "react-router";
import RetroButton from "../retro/RetroButton";

export default function EmptyArchiveState() {
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
