// src/services/ChatGodManager.ts

import type { AzureStyle, AzureVoice } from "../common/types";
import { TTSManager } from "./TTSManager";
import { TwitchChatManager } from "./TwitchChatManager";
import { WSManager } from "./WSManager";

// Decorator for method where we want to trigger an update to the frontend
function updateGodState(target: any, propertyKey: any, descriptor: PropertyDescriptor) {

    // Get the original function
    const original = descriptor.value;

    descriptor.value = function (this: ChatGodBase, ...args: any[]) {
        const result = original.apply(this, args);
        this.onStateChange();
        return result;
    }
    return descriptor;
}

class ChatGodBase {
    keyWord: string;
    currentChatter: string;
    chatPool: string[] = [];
    protected onStateChange: () => void;

    constructor(keyWord:string, onStateChange: () => void) {
        this.keyWord = keyWord;
        this.currentChatter = "NoCurrentChatter";
        this.onStateChange = onStateChange;
    }

    // Perform before all speech
    beforeSpeech = async (msg: string) => {
    }

    // Perform after all speech
    afterSpeech = async (msg: string) => {

    }

    // Perform after all speech
    performSpeech = async (msg: string) => {

    }

    speak = async (msg: string) => {
        await this.beforeSpeech(msg);
        await this.performSpeech(msg);
        await this.afterSpeech(msg);
    }
}

export class ChatGod extends ChatGodBase {
    latestMessage: string;
    ttsManager: TTSManager;
    isSpeaking: boolean;

    // TTS Variables
    ttsVoice: AzureVoice
    ttsStyle: AzureStyle;

    constructor(keyWord: string, onStateChange: () => void) {
        super(keyWord, onStateChange);
        this.isSpeaking = false;
        this.latestMessage = "Added a new chat god";

        // TTS settings
        this.ttsManager = new TTSManager();
        this.ttsVoice = this.ttsManager.voice;
        this.ttsStyle = this.ttsManager.style;
    }

    // Updates the message
    @updateGodState
    setLatestMessage (msg: string) {
        this.latestMessage = msg;
    }

    // Changes whether the audio is currently playing for this chatgod
    // Useful for the upstream animations
    @updateGodState
    toggleSpeakingState (state: boolean) {
        this.isSpeaking = state;
    }

    // Updates the TTS voice settings
    @updateGodState
    setTTSSettings (voice: AzureVoice, style: AzureStyle) {
        this.ttsStyle = style;
        this.ttsVoice = voice;
        this.ttsManager.setStyle(style);
        this.ttsManager.setVoice(voice);
    }

    emitTTSMessage = async (msg: string) => {
        if (this.ttsManager) {
            this.toggleSpeakingState(true)
            await this.ttsManager.emitMessage(msg);
            this.toggleSpeakingState(false);
        }
    }

    setCurrentChatter = async (chatter: string) => {
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

    // Speech process goes below here
    beforeSpeech = async (msg: string) => {
        this.setLatestMessage(msg);
    }

    performSpeech = async (msg: string) => {
        this.emitTTSMessage(msg);
    }
}

// Decorator for a function that is triggered by a frontend command
function updateFromFrontend(wsSubject: string) {
    return function decorator<
        This extends ChatGodManager,
        Args extends any[],
        Return
    >(
        originalMethod: (this: This, ...args: Args) => Return,
        _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
    ) {
        const methodName = _context.name as keyof This;

        _context.addInitializer(function (this: This) {
            const handler = (this[methodName] as (...args: Args) => Return).bind(this);
            this.wsManager.frontendIO.on(wsSubject, handler);
        });
    }
}


export class ChatGodManager {

    private chatGods: ChatGod[] = [];
    keyword: string = "!joingod";
    wsManager: WSManager = new WSManager();
    twitchChatManager: TwitchChatManager;
    watchThis: string = "watch this string for changes";

    // Creates a keyword based on index
    getKeyword = (idx: number) => `!joingod${idx}`;

    // Finds a ChatGod by its keyword
    getChatGodByKeyword = (keyword: string): ChatGod | undefined => {
        return this.chatGods.find(god => god.keyWord === keyword);
    }

    // Updates the chat gods to the frontend
    emitChatGods = () => {
        this.wsManager.emitChatGods(this.chatGods);
    }
    // Processes an incoming message
    processMessage(message: string, chatter: string) {

        console.log(`Recieved message from ${chatter}: ${message}`)
        // First, see if the message is attempting to join a ChatGod
        const words = message.split(" ");
        // See if the message starts with the keyword
        // If so, we have an attempt to join
        if (words[0]!.startsWith(this.keyword)) {

            const chatGod = this.getChatGodByKeyword(words[0]!);
            if (chatGod) {
                chatGod.addChatterToPool(chatter);
                console.log(`${chatter} added to ${chatGod.keyWord} pool`);
            }
            return;
        }

        // Attempt to send a current chatter
        for (const god of this.chatGods) {
            if (god.currentChatter === chatter) {
                god.speak(message);
                return;
            }
        }

    }

    constructor() {
        console.log("Attempting to start Chat God Manager")
        this.chatGods = [
            new ChatGod(this.getKeyword(1), this.emitChatGods),
            new ChatGod(this.getKeyword(2), this.emitChatGods),
            new ChatGod(this.getKeyword(3), this.emitChatGods),
        ]

        this.twitchChatManager = new TwitchChatManager(this.processMessage.bind(this));

        console.log('Chat God Manager is now running')
    }
}
