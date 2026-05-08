import { motion } from "motion/react";
import { Sparkles, Mail, Calendar, Lock, Check, Archive, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import RetroPageBackground from "../components/retro/RetroPageBackground";
import RetroWindow from "../components/retro/RetroWindow";
import RetroButton from "../components/retro/RetroButton";
import SectionHeader from "../components/retro/SectionHeader";
import FormField from "../components/retro/FormField";
import PaperPanel from "../components/retro/PaperPanel";
import VesselCard from "../components/compose/VesselCard";
import VesselPreview from "../components/compose/VesselPreview";
import type { VesselType } from "../components/compose/VesselCard";
import { saveCapsule, getCapsule, generateId, todayString } from "../../lib/capsules";

type FormErrors = {
  title?: string;
  message?: string;
  openDate?: string;
};

export default function ComposePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();

  const [selectedVessel, setSelectedVessel] = useState<VesselType>("capsule");
  const [privacyMode, setPrivacyMode] = useState<"private" | "shareable">("private");

  // Form state
  const [capsuleId, setCapsuleId] = useState(() => editId || generateId());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedStatus, setSavedStatus] = useState<null | "draft" | "sealed">(null);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!editId);

  // Load existing draft when editing
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    async function loadDraft() {
      try {
        const existing = await getCapsule(editId!);
        if (cancelled) return;
        if (!existing) {
          setLoadingDraft(false);
          return;
        }
        if (existing.status === "sealed" || existing.status === "opened") {
          navigate(`/capsules/${editId}`, { replace: true });
          return;
        }
        setCapsuleId(existing.id);
        setTitle(existing.title === "Untitled Capsule" ? "" : existing.title);
        setMessage(existing.message);
        setOpenDate(existing.openDate || "");
        setExistingCreatedAt(existing.createdAt);
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }

    loadDraft();
    return () => { cancelled = true; };
  }, [editId, navigate]);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Your capsule needs a name — even a short one";
    if (!message.trim()) e.message = "Say something to future you, even just a few words";
    if (!openDate) {
      e.openDate = "Choose when this capsule should unlock";
    } else if (openDate < todayString()) {
      e.openDate = "That date has already passed — pick a day still ahead";
    }
    return e;
  }

  async function handleSeal() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveCapsule({
        id: capsuleId,
        title: title.trim(),
        message: message.trim(),
        openDate,
        createdAt: existingCreatedAt || now,
        updatedAt: now,
        status: "sealed",
      });
      setSavedStatus("sealed");
    } catch {
      setErrors({ title: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!title.trim() && !message.trim()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveCapsule({
        id: capsuleId,
        title: title.trim() || "Untitled Capsule",
        message: message.trim(),
        openDate,
        createdAt: existingCreatedAt || now,
        updatedAt: now,
        status: "draft",
      });
      setSavedStatus("draft");
    } catch {
      setErrors({ title: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    const newId = generateId();
    setCapsuleId(newId);
    setTitle("");
    setMessage("");
    setOpenDate("");
    setExistingCreatedAt(null);
    setErrors({});
    setSavedStatus(null);
    navigate("/compose", { replace: true });
  }

  // --- Loading draft ---
  if (loadingDraft) {
    return (
      <RetroPageBackground sparkleCount={4}>
        <RetroWindow title="LOADING..." maxWidth="max-w-5xl">
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

  // --- Confirmation: Sealed ---
  if (savedStatus === "sealed") {
    return (
      <RetroPageBackground sparkleCount={10}>
        <RetroWindow title="CAPSULE SEALED" maxWidth="max-w-2xl">
          <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
            <motion.div
              className="mx-auto mb-8 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-retro-green-from to-retro-green-to border-[3px] border-black rounded-full flex items-center justify-center shadow-[var(--retro-shadow-selected)]"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-black" strokeWidth={3} />
            </motion.div>

            <SectionHeader
              title="SEALED SHUT"
              subtitle={`"${title}" is locked away until ${new Date(openDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Future you has mail.`}
              size="md"
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
                <Archive className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                View Archive
              </RetroButton>
              <RetroButton onClick={resetForm}>
                Write Another →
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- Confirmation: Draft saved ---
  if (savedStatus === "draft") {
    return (
      <RetroPageBackground sparkleCount={6}>
        <RetroWindow title="DRAFT SAVED" maxWidth="max-w-2xl">
          <div className="px-6 py-10 sm:px-14 sm:py-16 text-center">
            <motion.div
              className="mx-auto mb-8 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-retro-yellow-from to-retro-yellow-to border-[3px] border-black rounded-full flex items-center justify-center shadow-[var(--retro-shadow-selected)]"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Save className="w-10 h-10 sm:w-12 sm:h-12 text-black" strokeWidth={2.5} />
            </motion.div>

            <SectionHeader
              title="SAVED FOR LATER"
              subtitle={`"${title || "Untitled Capsule"}" is waiting in your archive. Come back whenever you're ready to finish it.`}
              size="md"
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <RetroButton variant="ghost" onClick={() => {
                setSavedStatus(null);
              }}>
                Keep Writing
              </RetroButton>
              <RetroButton variant="secondary" onClick={() => navigate("/archive")}>
                <Archive className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                View Archive
              </RetroButton>
              <RetroButton onClick={resetForm}>
                Start a New One →
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </RetroPageBackground>
    );
  }

  // --- Compose form ---
  return (
    <RetroPageBackground sparkleCount={6}>
      <RetroWindow title={editId ? "EDITING DRAFT" : "CAPSULE COMPOSER v1.0"} maxWidth="max-w-5xl">
        <div className="p-5 sm:p-10">
          <SectionHeader
            title={editId ? "CONTINUE WRITING" : "NEW CAPSULE"}
            subtitle={editId
              ? "Pick up where you left off. Seal it when you're ready."
              : "Write something worth remembering. Your future self will thank you."
            }
            size="md"
          />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form inputs */}
            <div className="lg:col-span-2 space-y-6">
              <FormField label="Title" error={errors.title} hint="Optional for drafts">
                <input
                  type="text"
                  placeholder="A name for this moment"
                  className="retro-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              <FormField label="Your Message" error={errors.message}>
                <textarea
                  rows={7}
                  placeholder="Dear future me..."
                  className="retro-input resize-none leading-relaxed"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </FormField>

              <FormField
                label="Unlock Date"
                error={errors.openDate}
                hint="When should future you be able to open this?"
              >
                <div className="relative">
                  <input
                    type="date"
                    className="retro-input"
                    value={openDate}
                    min={todayString()}
                    onChange={(e) => setOpenDate(e.target.value)}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 pointer-events-none"
                    strokeWidth={2.5}
                  />
                </div>
              </FormField>

              {/* Privacy Mode */}
              <div>
                <label className="block text-sm font-bold text-black mb-2.5 uppercase tracking-wide">
                  Privacy Mode
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPrivacyMode("private")}
                    className={`flex-1 px-4 py-3 border-[2.5px] border-black/80 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                      privacyMode === "private"
                        ? "bg-gradient-to-b from-retro-green-from to-retro-green-to shadow-[var(--retro-shadow-selected)]"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  >
                    <Lock className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                    <span className="whitespace-nowrap">Private</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacyMode("shareable")}
                    className={`flex-1 px-4 py-3 border-[2.5px] border-black/80 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                      privacyMode === "shareable"
                        ? "bg-gradient-to-b from-retro-pink-from to-retro-pink-to shadow-[var(--retro-shadow-selected)]"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  >
                    <Mail className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                    <span className="whitespace-nowrap">Share Link</span>
                  </button>
                </div>
              </div>

              {/* Vessel selector */}
              <div>
                <label className="block text-sm font-bold text-black mb-2.5 uppercase tracking-wide">
                  Choose a Vessel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <VesselCard type="capsule" selected={selectedVessel === "capsule"} onClick={() => setSelectedVessel("capsule")} />
                  <VesselCard type="envelope" selected={selectedVessel === "envelope"} onClick={() => setSelectedVessel("envelope")} />
                  <VesselCard type="constellation" selected={selectedVessel === "constellation"} onClick={() => setSelectedVessel("constellation")} />
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-1">
              <PaperPanel className="h-full min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-sm font-bold text-black/70 uppercase tracking-widest mb-4">
                  Your Vessel
                </div>

                <VesselPreview vessel={selectedVessel} />

                <div className="mt-6 text-center">
                  <p className="text-xs text-black/70 font-medium leading-relaxed">
                    How your capsule will look while it waits
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t-[2.5px] border-black/15">
            <RetroButton variant="ghost" onClick={() => navigate(editId ? "/archive" : "/")}>
              Cancel
            </RetroButton>

            <div className="flex gap-3">
              <RetroButton variant="secondary" onClick={handleSaveDraft}>
                {saving ? (
                  <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Save className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                )}
                Save for Later
              </RetroButton>
              <RetroButton onClick={handleSeal}>
                {saving ? (
                  <Loader2 className="w-4 h-4 inline-block mr-1.5 mb-0.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Sparkles className="w-4 h-4 inline-block mr-1.5 mb-0.5" strokeWidth={2.5} />
                )}
                Seal This Capsule
              </RetroButton>
            </div>
          </div>
        </div>
      </RetroWindow>
    </RetroPageBackground>
  );
}
