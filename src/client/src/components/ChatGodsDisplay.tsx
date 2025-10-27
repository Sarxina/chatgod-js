'use client';

import { ChatGod, type ChatGodProps } from "./ChatGod.js";


export const ChatGodsDisplay = ({chatGods}: {chatGods: ChatGodProps[]}) => {
    return (
        <div className="flex flex-row">
            {chatGods.map((chatGod, idx) => (
                <div key={chatGod.keyWord}>
                    <ChatGod {...chatGod}/>
                </div>
            ))}
        </div>
    )
}
