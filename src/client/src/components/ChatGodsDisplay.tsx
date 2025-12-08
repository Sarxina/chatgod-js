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
        <div className="flex flex-row gap-x-20">
            {chatGods.map((chatGod) => (
                <div key={chatGod.keyWord} className="w-120 h-120">
                    <ChatGod
                    {...chatGod}
                    onUpdate={onUpdate}
                    />
                </div>
            ))}
        </div>
    )
}
