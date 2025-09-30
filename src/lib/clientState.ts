// This file contains the functionality for updating the frontend from backend state

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ChatGodData {
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
}

// Given a socket and a callback, runs the callback any time the backend
// calls chatgod-update
export const onChatGodUpdate = (socket: Socket, callback: (data: any) => void) => {
    socket.on('chatgod-update', (chatGodData: ChatGodData) => {
        callback(chatGodData);
    })
}

export const useChatGods = () => {
    const [chatGods, setChatGods] = useState<ChatGodData[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        onChatGodUpdate(newSocket, (data) => {
            setChatGods(data);
        })
    }, []);

    return chatGods
}
