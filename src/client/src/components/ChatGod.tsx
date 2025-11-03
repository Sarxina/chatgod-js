'use client';

import type { ChatGodProps } from "../../../common/types.js";

// Containts the component for a single Chat God
export const ChatGod = ({latestMessage, keyWord, currentChatter, ttsVoice, ttsStyle}: ChatGodProps) => {
    return (
        <div>
            <p>{latestMessage}</p>
            <p>{currentChatter}</p>
            <p>{keyWord}</p>
            <p>{ttsVoice}</p>
            <p>{ttsStyle}</p>
        </div>
    )
}
