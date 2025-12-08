'use client'

import { useChatGods } from "../../clientState.js";
import { ChatGodsDisplay } from "./ChatGodsDisplay.js";

export default function Home() {
  const [chatGods, updateChatGod] = useChatGods()
  return (
    <div>
      <ChatGodsDisplay
        chatGods={chatGods}
        onUpdate={updateChatGod}
      />
    </div>
  );
}
