// Manager for websocket communication

import { Socket } from "socket.io"

export class WSManager {
    io: Socket

    constructor() {
        this.io = io()
    }
}
