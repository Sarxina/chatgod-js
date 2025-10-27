'use client'

import { ChatGodsDisplay } from "./ChatGodsDisplay.js";
import clientState = require("../../clientState.js");

export default function Home() {
  const chatGods = clientState.useChatGods();
  return (
    <div>
      <ChatGodsDisplay chatGods={chatGods}/>
    </div>
  );
}
