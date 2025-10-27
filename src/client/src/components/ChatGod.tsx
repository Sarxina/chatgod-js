'use client';

import type { AzureVoice, AzureStyle } from "../../../common/types.js";

export interface ChatGodProps {
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
    ttsVoice: AzureVoice;
    ttsStyle: AzureStyle;
}

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
