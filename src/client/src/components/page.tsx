'use client'

import { useChatGods } from "../../clientState.js";
import { ChatGodsDisplay } from "./ChatGodsDisplay.js";

export default function Home() {
  const chatGods = useChatGods()
  return (
    <div>
      <ChatGodsDisplay chatGods={chatGods}/>
    </div>
  );
}
