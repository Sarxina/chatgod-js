// Manager for websocket communication

import { Server } from "socket.io"
import { ChatGod } from "./ChatGodManager";
import OBSWebSocket from "obs-websocket-js";
import type { ChatGodProps } from "../common/types";

export class WSManager {
    frontendIO: Server;
    obsIO: OBSWebSocket;

    constructor() {
        this.frontendIO = new Server(5173, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        this.obsIO = new OBSWebSocket();
    }

    connectToOBS = async () => {
        await this.obsIO.connect('ws://localhost:4455','obspassword');
    }

    emitChatGods = (chatGods: ChatGodProps[]) => {
        this.frontendIO.emit("chatgod-update", chatGods)
    }
}
