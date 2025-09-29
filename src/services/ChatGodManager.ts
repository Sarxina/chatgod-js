// src/services/ChatGodManager.ts

class ChatGod {
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
    chatPool: string[] = [];
    ttsManager: TTSManager

    constructor(keyWord: string) {
        this.latestMessage = "Added a new chat god";
        this.keyWord = keyWord;
        this.currentChatter = "No current chatter";
        this.ttsManager = new TTSManager();
    }

    setCurrentChatter(chatter: string) {
        this.currentChatter = chatter;
    }

    getNextChatter(): string {
        if (this.chatPool.length === 0) {
            console.warn("Chat pool is empty, staying with current chatter");
            return this.currentChatter;
        }
        return this.chatPool.pop() || this.currentChatter;
    }

    addChatterToPool(chatter: string) {
        this.chatPool.push(chatter);
    }

    speak() {
        
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
