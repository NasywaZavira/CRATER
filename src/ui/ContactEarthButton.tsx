// src/ui/ContactEarthButton.tsx  (part of V6-02)
// Bottom-left button. Does NOT pause the event timer (sheet rule).
// Parent decides what onContact does (dispatch an action); the reply is delayed by the engine.
import { Icon } from "@iconify/react";

export function ContactEarthButton({
  onContact,
  pending = false,
  disabled = false,
}: {
  onContact: () => void;
  pending?: boolean; // waiting for Earth's delayed reply
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onContact}
      disabled={disabled || pending}
      className="absolute bottom-3 left-3 z-30 flex min-h-11 items-center gap-2 rounded-full px-4 text-sm disabled:opacity-60"
      style={{
        background: "var(--hud-panel)",
        border: "1px solid var(--hud-panel-border)",
        color: "var(--hud-text)",
      }}
    >
      <Icon icon="mdi:satellite-variant" width={18} height={18} aria-hidden />
      {pending ? "Awaiting reply…" : "Contact Earth"}
    </button>
  );
}
