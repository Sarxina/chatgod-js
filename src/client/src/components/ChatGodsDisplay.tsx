'use client';

import type { ChatGodProps } from "../../../common/types.js";
import { ChatGod } from "./ChatGod.js";


export const ChatGodsDisplay = ({
    chatGods,
    onUpdate
}: {
    chatGods: ChatGodProps[],
    onUpdate: (keyword: string, field: string, value: any) => void
}) => {
    return (
        <div className="flex flex-row">
            {chatGods.map((chatGod) => (
                <div key={chatGod.keyWord}>
                    <ChatGod 
                    {...chatGod}
                    onUpdate={onUpdate}
                    />
                </div>
            ))}
        </div>
    )
}
