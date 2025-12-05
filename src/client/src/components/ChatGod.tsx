'use client';

import type { ChatGodProps } from "../../../common/types.js";



// Containts the component for a single Chat God
export const ChatGod = ({
    latestMessage, 
    keyWord, 
    currentChatter, 
    ttsVoice, 
    ttsStyle,
    onUpdate
}: ChatGodProps & {onUpdate: (keyword: string, field: string, value: any) => void}) => {
    return (
        <div>
            <p>{latestMessage}</p>
            <input 
                type="text"
                value={currentChatter}
                onChange={(e) => onUpdate(keyWord, 'currentChatter', e.target.value)}

            />
            <p>{keyWord}</p>
            <p>{ttsVoice}</p>
            <p>{ttsStyle}</p>
        </div>
    )
}
