'use client';

export interface ChatGodProps {
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
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
