// src/services/ChatGodManager.ts

export class ChatGod {
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
    chatPool: string[] = [];
    ttsManager: TTSManager
    // Callback array allowing for custom functionality, different games, etc
    callbacks: Array<(msg: string) => void> = [];

    constructor(keyWord: string) {
        this.latestMessage = "Added a new chat god";
        this.keyWord = keyWord;
        this.currentChatter = "No current chatter";
        this.ttsManager = new TTSManager();
    }

    setCurrentChatter = (chatter: string) => {
        this.currentChatter = chatter;
    }

    getNextChatter = (): string => {
        if (this.chatPool.length === 0) {
            console.warn("Chat pool is empty, staying with current chatter");
            return this.currentChatter;
        }
        return this.chatPool.pop() || this.currentChatter;
    }

    addChatterToPool = (chatter: string) => {
        this.chatPool.push(chatter);
    }

    // Add a list of functions for this chat god to run wheenever they speak
    addCallback = (callback: (msg: string) => void) => {
        this.callbacks.push(callback);
    }

    // Handle this chat god speaking a message
    speak = (msg: string) => {
        this.latestMessage = msg;
        this.callbacks.forEach((callback) => {
            callback(msg);
        })
        if (this.ttsManager) {
            this.ttsManager.emitMessage(msg);
        };
    }
}

class ChatGodManager {

    private chatGods: ChatGod[] = [];
    keyword: string = "!joingod";

    // Creates a keyword based on index
    getKeyword = (idx: number) => `!joingod${idx}`;

    // Finds a ChatGod by its keyword
    getChatGodByKeyword = (keyword: string): ChatGod | undefined => {
        return this.chatGods.find(god => god.keyWord === keyword);
    }

    // Processes an incoming message
    processMessage(message: string, chatter: string) {

        // First, see if the message is attempting to join a ChatGod
        const words = message.split(" ");
        // See if the message starts with the keyword
        // If so, we have an attempt to join
        if (words[0].startsWith(this.keyword)) {

            const chatGod = this.getChatGodByKeyword(words[0]);
            if (chatGod) {
                chatGod.addChatterToPool(chatter);
                console.log(`${chatter} added to ${chatGod.keyWord} pool`);
            }
            return;
        }

        // Attempt to send a current chatter
        for (const god of this.chatGods) {
            if (god.currentChatter === chatter) {
                god.latestMessage = message;
                console.log(`Updated ${god.keyWord} latest message to: ${message}`);
                return;
            }
        }

    }
    constructor() {
        this.chatGods = [
            new ChatGod(this.getKeyword(1)),
            new ChatGod(this.getKeyword(2)),
            new ChatGod(this.getKeyword(3)),
        ]
    }
}

export const chatGodManager = new ChatGodManager();
