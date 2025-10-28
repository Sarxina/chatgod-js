'use client'
// This file contains the functionality for updating the frontend from backend state

import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client"
import { ChatGod } from "../services/ChatGodManager.js";
import type { ChatGodProps } from "../common/types.js";

// Transforms Chat God objects into react props
const chatGodToProps = (chatGodData: ChatGod[]) => {
    const chatGodProps = [];

    for (const god of chatGodData) {
        const prop = {
            keyWord: god.keyWord,
            currentChatter: god.currentChatter,
            latestMessage: god.latestMessage,
            ttsVoice: god.ttsVoice,
            ttsStyle: god.ttsStyle
        }
        chatGodProps.push(prop);
    };
    return chatGodProps
}

// Given a socket and a callback, runs the callback any time the backend
// calls chatgod-update
export const onChatGodUpdate = (socket: Socket<any, any> | null, callback: (data: any) => void) => {
    socket.on('chatgod-update', (chatGodData: ChatGod[]) => {
        callback(chatGodData);
    })
}

// Ping the backend to update the frontend
const getChatGods = (socket: Socket<any, any> | null) => {
    socket!.emit("get-chatgods");
}

const openSocket = (setSocket:React.Dispatch<React.SetStateAction<Socket<any, any> | null>>) => {
    const newSocket = io();
    setSocket(newSocket);
}

export const useChatGods = () => {
    const [chatGods, setChatGods] = useState<ChatGodProps[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        openSocket(setSocket)
        onChatGodUpdate(socket, (data) => {
            const props: ChatGodProps[] = data;
            setChatGods(props);
        })

    }, []);
    openSocket(setSocket)
    getChatGods(socket)
    return chatGods;
}
