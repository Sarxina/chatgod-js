// Manager for websocket communication

import { Server } from "socket.io"
import { ChatGod } from "./ChatGodManager";
import OBSWebSocket from "obs-websocket-js";

export class WSManager {
    frontendIO: Server;
    obsIO: OBSWebSocket;

    constructor() {
        this.frontendIO = new Server(3001, {
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

    emitChatGods = (chatGods: ChatGod[]) => {
        this.frontendIO.emit("chatgod-update", chatGods)
    }
}
