'use client';

import type { ChatGodProps } from "../../../common/types.js";
import { ChatGodImage } from "./ChatGodImage.js";

// Containts the component for a single Chat God
export const ChatGod = ({
    latestMessage,
    keyWord,
    currentChatter,
    ttsVoice,
    ttsStyle,
    isSpeaking,
    image,
    onUpdate
}: ChatGodProps & {onUpdate: (keyword: string, field: string, value: any) => void}) => {
    return (
        <div className="h-full flex flex-col">
            <div className="h-2/5">
                <ChatGodImage image={image} isSpeaking={isSpeaking}/>
            </div>
            <div className="h-2/5 text-cyan-300 overflow-hidden flex items-start justify-center text-center text-xl">
                <p>{latestMessage}</p>
            </div>
            <div className="flex-1 bg-gray-800 p-2 border border-gray-600 rounded text-xs space-y-1">
                <input
                    type="text"
                    value={currentChatter}
                    onChange={(e) => onUpdate(keyWord, 'currentChatter', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white"
                    placeholder="Current Chatter"
                />
                <p className="text-gray-300">Keyword: {keyWord}</p>
                <p className="text-gray-300">Voice: {ttsVoice}</p>
                <p className="text-gray-300">Style: {ttsStyle}</p>
            </div>
        </div>
    )
}
