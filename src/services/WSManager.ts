// Manager for websocket communication

import { Server } from "socket.io"
import { ChatGod } from "./ChatGodManager";
import OBSWebSocket from "obs-websocket-js";
import type { ChatGodProps } from "../common/types";
import http from "http";

// handles communication with both the frontend and OBS, if needed
export class WSManager {
    frontendIO: Server;
    obsIO: OBSWebSocket;

    constructor(server: http.Server | null = null) {

        // Either use the backend server as the websocket, or use a new port
        this.frontendIO = new Server(server || Number(process.env.BACKEND_PORT), {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        this.frontendIO.on('connection', (socket) => {
            console.log('Client connected', socket.id);
        })

        this.obsIO = new OBSWebSocket();
    }

    // Registers a function to be called on a subject from the frontend
    registerFrontendListener = (wsSubject: string, handler: (...args: any[]) => void) => {
        this.frontendIO.on('connection', (socket) => {
            socket.on(wsSubject, handler);
        })
    }

    connectToOBS = async () => {
        await this.obsIO.connect('ws://localhost:4455','obspassword');
    }

    emitChatGods = (chatGods: ChatGodProps[]) => {
        this.frontendIO.emit("chatgod-update", chatGods)
    }
}
