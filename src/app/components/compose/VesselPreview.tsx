import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { VesselType } from "./VesselCard";

export default function VesselPreview({ vessel }: { vessel: VesselType }) {
  if (vessel === "capsule") {
    return (
      <motion.div
        className="relative w-32 h-32"
        animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 bottom-0 right-1/2 bg-gradient-to-br from-retro-green-from to-retro-green-to border-[2.5px] border-black rounded-l-full" />
          <div className="absolute right-0 top-0 bottom-0 left-1/2 bg-gradient-to-br from-retro-pink-from to-retro-pink-to border-[2.5px] border-black rounded-r-full border-l-0" />
          <div className="absolute left-1/2 top-2 bottom-2 w-[3px] bg-black transform -translate-x-1/2 rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[2.5px] border-black rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (vessel === "envelope") {
    return (
      <motion.div
        className="relative w-36 h-28"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFE8E8] to-[#FFCCCC] border-[2.5px] border-black rounded-lg" />
        <div
          className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-br from-[#FFC9C9] to-[#FFB6B6] border-[2.5px] border-black rounded-t-lg border-b-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFC700] border-[2.5px] border-black rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
      </motion.div>
    );
  }

  // constellation
  return (
    <motion.div
      className="relative w-36 h-36"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {[...Array(5)].map((_, i) => {
        const angle = (i * 72) * (Math.PI / 180);
        const radius = 45;
        return (
          <div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-br from-retro-yellow-to to-[#FFD700] border-[2px] border-black rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top: `calc(50% + ${Math.sin(angle) * radius}px)`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[2.5px] border-black rounded-full flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-black" strokeWidth={3} />
      </div>
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ transform: "rotate(-90deg)" }}
      >
        {[...Array(5)].map((_, i) => {
          const angle1 = (i * 72) * (Math.PI / 180);
          const angle2 = ((i + 1) * 72) * (Math.PI / 180);
          const radius = 45;
          return (
            <line
              key={i}
              x1={`calc(50% + ${Math.cos(angle1) * radius}px)`}
              y1={`calc(50% + ${Math.sin(angle1) * radius}px)`}
              x2={`calc(50% + ${Math.cos(angle2) * radius}px)`}
              y2={`calc(50% + ${Math.sin(angle2) * radius}px)`}
              stroke="black"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
