"use client";

import AndonCopilotWorkspace from "@/components/andon-copilot/AndonCopilotWorkspace";

/**
 * Dedicated copilot workspace (AG-UI + premium UI). Kept thin so layout lives under `andon-copilot/`.
 */
export default function AndonCopilotScreen() {
  return <AndonCopilotWorkspace />;
}
