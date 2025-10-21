import { ChatClient } from "@twurple/chat";
import { ChatGodManager } from "./ChatGodManager";
import { StaticAuthProvider } from "@twurple/auth";

export class TwitchChatManager {
    private chatGodManager: ChatGodManager
    private chatClient!: ChatClient

    constructor(chatGodManager: ChatGodManager) {
        this.chatGodManager = chatGodManager;
        this.setupTwitchConnection();
    }

    private setupTwitchConnection = async () => {

        const authProvider = new StaticAuthProvider(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_ACCESS_TOKEN!
        );

        this.chatClient = new ChatClient({
            authProvider,
            channels: [process.env.TWITCH_CHANNEL_NAME!]
        });

        this.chatClient.onMessage((channel, user, message) => {
            this.chatGodManager.processMessage(message, user);
        })

        this.chatClient.connect();
        console.log("Connected to Twitch Chat")
    }
}
