// Code for emitting updates to the frontend
import { ChatGod } from "@/services/ChatGodManager";
import { Server } from "socket.io";

export const emitChatGods = (io: Server, chatGods: ChatGod) => {
    io.emit("chatgod-update", chatGods)
}
