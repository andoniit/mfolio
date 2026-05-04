"use client";

import { useAICopilotContext } from "@/context/AICopilotContext";
import CopilotLayout from "./CopilotLayout";
import CopilotPreviewPanel from "./CopilotPreviewPanel";
import CopilotChat from "./CopilotChat";

/**
 * Minimal copilot: live preview + chat only.
 */
export default function AndonCopilotWorkspace() {
  const { messages, sendUserMessage, isRunning, rootState, clearChat } = useAICopilotContext();

  return (
    <CopilotLayout
      preview={<CopilotPreviewPanel rootState={rootState} />}
      rail={<CopilotChat messages={messages} isRunning={isRunning} rootState={rootState} sendUserMessage={sendUserMessage} clearChat={clearChat} />}
    />
  );
}
