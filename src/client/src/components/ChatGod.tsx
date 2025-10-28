'use client';

import type { ChatGodProps } from "../../../common/types.js";

// Containts the component for a single Chat God
export const ChatGod = ({latestMessage, keyWord, currentChatter}: ChatGodProps) => {
    return (
        <div>
            <p>{currentChatter}</p>
            <p>{latestMessage}</p>
            <p>{keyWord}</p>
        </div>
    )
}
