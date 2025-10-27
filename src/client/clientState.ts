'use client'
// This file contains the functionality for updating the frontend from backend state

import { ChatGod } from "@/services/ChatGodManager";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";


// Given a socket and a callback, runs the callback any time the backend
// calls chatgod-update
export const onChatGodUpdate = (socket: Socket, callback: (data: any) => void) => {
    socket.on('chatgod-update', (chatGodData: ChatGod[]) => {
        callback(chatGodData);
    })
}

export const useChatGods = () => {
    console.log("Running useChatGods")
    const [chatGods, setChatGods] = useState<ChatGod[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {

        console.log('Attempting Initialization')
        fetch('/api/chatgods')
        const newSocket = io();
        setSocket(newSocket);

        onChatGodUpdate(newSocket, (data) => {
            setChatGods(data);
        })
    }, []);

    return chatGods
}
