// src/services/ChatGodManager.ts

import type { AzureStyle, AzureVoice } from "../common/types";
import { TTSManager } from "./TTSManager";
import { TwitchChatManager } from "./TwitchChatManager";
import { WSManager } from "./WSManager";
import http from "http";


// Decorator for method where we want to trigger an update to the frontend
function updateGodState(_target: any, _propertyKey: any, descriptor: PropertyDescriptor) {

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
    image: string;
    keyWord: string;
    currentChatter: string;
    chatPool: string[] = [];
    protected onStateChange: () => void;

    constructor(keyWord:string, onStateChange: () => void) {
        this.image = 'thinkingemoji.png'
        this.keyWord = keyWord;
        this.currentChatter = "NoCurrentChatter";
        this.onStateChange = onStateChange;
    }

    // Perform before all speech
    beforeSpeech = async (_msg: string) => {
    }

    // Perform after all speech
    afterSpeech = async (_msg: string) => {

    }

    // Perform after all speech
    performSpeech = async (_msg: string) => {

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

    // Format the ChatGod in a way usable on the frontend
    serialize () {
        return {
            image: this.image,
            keyWord: this.keyWord,
            currentChatter: this.currentChatter,
            latestMessage: this.latestMessage,
            ttsVoice: this.ttsVoice,
            ttsStyle: this.ttsStyle,
            isSpeaking: this.isSpeaking
        }
    }

    // Updates the message
    @updateGodState
    setLatestMessage(msg: string) {
        this.latestMessage = msg;
    }

    // Changes whether the audio is currently playing for this chatgod
    // Useful for the upstream animations
    @updateGodState
    toggleSpeakingState(state: boolean) {
        this.isSpeaking = state;
    }

    // Updates the TTS voice settings
    @updateGodState
    setTTSSettings(voice: AzureVoice, style: AzureStyle) {
        this.ttsStyle = style;
        this.ttsVoice = voice;
        this.ttsManager.setStyle(style);
        this.ttsManager.setVoice(voice);
    }

    emitTTSMessage = async (msg: string) => {
        if (this.ttsManager) {
            // emit message takes the message, a callback to run when the audio is ready,
            // and a callback to run when its done
            // theres not a super clean way to sync animation and audio other than just delaying
            // the animation for a little bit
            await this.ttsManager.emitMessage(
                msg,
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    this.toggleSpeakingState(true)
                },
                () => this.toggleSpeakingState(false)
            )
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


function updateFromFrontend(wsSubject: string) {
    return function decorator(target: any, methodName: any) {

        // Create the array of frontend bindings if they aren't yet created
        if (!target.__frontendBindings) target.__frontendBindings = [];

        target.__frontendBindings.push({wsSubject, methodName});
    }
}


export class ChatGodManager {

    static ChatGodClass: typeof ChatGod = ChatGod;
    private chatGods: ChatGod[] = [];
    keyword: string = "!joingod";
    wsManager: WSManager;
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
        this.wsManager.emitChatGods(this.chatGods.map(g => g.serialize()));
    }

    @updateFromFrontend('get-chatgods')
    respondChatGods = (data: any) => {
        this.emitChatGods();
    }

    @updateFromFrontend('set-chatter')
    setChatter = (data: any) => {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.setCurrentChatter(data.chatter);
    }

    @updateFromFrontend('set-voice-speaker')
    setVoiceSpeaker = (data: any) => {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.setTTSSettings(data.voice, chatGod.ttsStyle);
    }

    @updateFromFrontend('set-voice-style')
    setVoiceStyle = (data: any) => {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.setTTSSettings(chatGod.ttsVoice, data.style);
    }
    // Processes an incoming message
    processMessage(message: string, chatter: string) {

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

    constructor(server: http.Server | null = null) {
        console.log("Attempting to start Chat God Manager")

        const GodType = ChatGodManager.ChatGodClass;

        this.chatGods = [
            new GodType(this.getKeyword(1), this.emitChatGods),
            new GodType(this.getKeyword(2), this.emitChatGods),
            new GodType(this.getKeyword(3), this.emitChatGods),
        ]

        this.twitchChatManager = new TwitchChatManager(this.processMessage.bind(this));
        this.wsManager = new WSManager(server);
        // Register all of the subjects that communicate with the frontend
        const bindings = (this as any).__proto__.__frontendBindings;
        console.log(bindings)
        if (bindings) {
            for (const {wsSubject, methodName} of bindings) {
                this.wsManager.registerFrontendListener(wsSubject, (this as any)[methodName].bind(this));
            }
        }

        console.log('Chat God Manager is now running')
        this.emitChatGods();
    }
}
