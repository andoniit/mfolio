import type { Metadata } from "next";
import { AICopilotProvider } from "@/context/AICopilotContext";
import AndonCopilotScreen from "@/components/AICopilot/AndonCopilotScreen";

export const metadata: Metadata = {
  title: "Andon Copilot",
  description: "Chat with the portfolio copilot alongside a live preview — anikap.tech",
  robots: { index: false, follow: true },
};

export default function AndonCopilotPage() {
  return (
    <AICopilotProvider>
      <AndonCopilotScreen />
    </AICopilotProvider>
  );
}
