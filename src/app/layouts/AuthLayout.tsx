import { Navigate, Outlet } from "react-router";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth";
import MigrationModal from "../components/MigrationModal";
import RetroPageBackground from "../components/retro/RetroPageBackground";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <RetroPageBackground sparkleCount={3}>
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <MigrationModal />
      <Outlet />
    </>
  );
}
