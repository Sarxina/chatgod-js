import { ChatClient } from "@twurple/chat";
import { StaticAuthProvider } from "@twurple/auth";

export class TwitchChatManager {
    private chatClient!: ChatClient

    // msgCallbalk is the function you want called when a message is sent
    constructor(msgCallback: (message: string, chatter: string) => void) {
        this.setupTwitchConnection(msgCallback);
    }

    private setupTwitchConnection = async (msgCallback: (message: string, chatter: string) => void) => {

        const authProvider = new StaticAuthProvider(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_ACCESS_TOKEN!
        );

        this.chatClient = new ChatClient({
            authProvider,
            channels: [process.env.TWITCH_CHANNEL_NAME!]
        });

        this.chatClient.onMessage((channel, user, message) => {
            msgCallback(message, user);
        })

        this.chatClient.connect();
        console.log("Connected to Twitch Chat")
    }
}
