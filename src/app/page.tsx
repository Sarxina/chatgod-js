import { useChatGods } from "@/lib/clientState";
import { ChatGodsDisplay } from "./components/ChatGodsDisplay";

export default function Home() {
  const chatGods = useChatGods();
  return (
    <div>
      <ChatGodsDisplay chatGods={chatGods}/>
    </div>
  );
}
