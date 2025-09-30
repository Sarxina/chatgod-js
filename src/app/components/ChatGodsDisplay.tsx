'use client';

import { ChatGod, ChatGodProps } from "./ChatGod";

interface ChatGodDisplayProps {
    chatGods: ChatGodProps[]
}

export const ChatGodsDisplay = ({chatGods}: ChatGodDisplayProps) => {
    return (
        <div className="flex flex-row">
            {chatGods.map((chatGod, idx) => (
                <div key={chatGod.keyWord}>
                    <ChatGod
                        latestMessage={chatGod.latestMessage}
                        keyWord={chatGod.keyWord}
                        currentChatter={chatGod.currentChatter}
                    />
                </div>
            ))}
        </div>
    )
}
