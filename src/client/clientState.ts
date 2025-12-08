'use client'
// This file contains the functionality for updating the frontend from backend state

import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client"
import { ChatGod } from "../services/ChatGodManager.js";
import type { AzureStyle, AzureVoice, ChatGodProps } from "../common/types.js";

// Transforms Chat God objects into react props
export const chatGodToProps = (chatGodData: ChatGod[]): ChatGodProps[] => {
    const chatGodProps = [];

    for (const god of chatGodData) {
        const prop = {
            keyWord: god.keyWord,
            currentChatter: god.currentChatter,
            latestMessage: god.latestMessage,
            ttsVoice: god.ttsVoice,
            ttsStyle: god.ttsStyle,
            isSpeaking: god.isSpeaking
        }
        chatGodProps.push(prop);
    };
    return chatGodProps
}

// Given a socket and a callback, runs the callback any time the backend
// calls chatgod-update
export const onChatGodUpdate = (socket: Socket<any, any>, callback: (data: any) => void) => {
    socket.on('chatgod-update', (chatGodData: ChatGod[]) => {
        callback(chatGodData);
    })
}

const updateChatter = (keyWord: string, chatter: string, socket: Socket<any, any>) => {
    socket.emit('set-chatter', {chatter, keyWord});
}

const updateVoiceSpeaker = (keyWord: string, voice: AzureVoice, socket: Socket)  => {
    socket.emit('set-voice-speaker', {voice,  keyWord});
}

const updateVoiceStyle = (keyWord: string, style: AzureStyle, socket: Socket) => {
    socket.emit('set-voice-style', {style, keyWord});
}

export const useChatGods = (): [ChatGodProps[], (keyWord: string, field: string, value: any) => void] => {
    const [chatGods, setChatGods] = useState<ChatGodProps[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(`http://localhost:3333`);
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('connect', () => {
            socket.emit('get-chatgods')
        })

        socket.on('chatgod-update', (chatGodData: ChatGodProps[]) => {
            setChatGods(chatGodData);
        });

        return () => {
            socket.off('connect');
            socket.off("chatgod-update");
        }
    }, [socket]);

    const updateChatGod = (keyWord: string, field: string, value: any) => {

        setChatGods(prev => prev.map(god =>
            god.keyWord === keyWord
            ? {...god, [field]: value}
            : god
        ));

        if (!socket) return;
        switch (field) {
            case 'currentChatter':
                updateChatter(keyWord, value, socket);
                break;
        }
    }

    return [chatGods, updateChatGod];
}
