// src/services/ChatGodManager.ts

import type { AzureStyle, AzureVoice, ChatGodProps } from "../common/types.js";
import { TTSManager } from "./TTSManager.js";
import {
    Action,
    ActionRegistry,
    TwitchManager,
    type TriggerFiring,
    type TwitchChatTriggerInput,
} from "@sarxina/sarxina-tools";
import { WSManager } from "./WSManager.js";
import type http from "http";

// --- Decorators (TC39 stage-3) ---

// Method decorator: wraps the method so that calling it also triggers
// onStateChange() on the instance.
export function updateGodState<This extends ChatGodBase, Args extends unknown[], Return>(
    originalMethod: (this: This, ...args: Args) => Return,
    _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
    return function (this: This, ...args: Args): Return {
        const result = originalMethod.call(this, ...args);
        this.onStateChange();
        return result;
    };
}

// Method decorator factory: registers the method as a frontend listener for
// the given wsSubject. The binding is recorded on the instance via an
// initializer that runs at construction time.
export function updateFromFrontend(wsSubject: string) {
    return function decorator<This extends { __frontendBindings?: FrontendBinding[] }, Args extends unknown[], Return>(
        _originalMethod: (this: This, ...args: Args) => Return,
        context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
    ): void {
        const methodName = String(context.name);
        context.addInitializer(function (this: This) {
            if (!this.__frontendBindings) this.__frontendBindings = [];
            this.__frontendBindings.push({ wsSubject, methodName });
        });
    };
}

interface FrontendBinding {
    wsSubject: string;
    methodName: string;
}

// --- Classes ---

class ChatGodBase {
    image: string;
    keyWord: string;
    currentChatter: string;
    chatPool: string[] = [];
    onStateChange: () => void;
    onChatterChange?: (newChatter: string) => void;
    onQueueJoin?: (chatter: string) => void;
    private intervalId: NodeJS.Timeout;

    constructor(
        keyWord: string,
        onStateChange: () => void,
        newChatterInterval: number = 10 // Time before a new chatter in minutes
    ) {
        this.image = "SkrunklyMouthClosed.png";
        this.keyWord = keyWord;
        this.currentChatter = "NoCurrentChatter";
        this.onStateChange = onStateChange;

        this.intervalId = setInterval(() => {
            this.duringInterval();
        }, newChatterInterval * 60 * 1000);
    }

    // Handle when a new chatter is supposed to be chosen
    duringInterval(): void {
        // base no-op; subclasses override
        void this.intervalId;
    }

    // Perform before all speech
    beforeSpeech = async (_msg: string): Promise<void> => {
        // base no-op; subclasses override
    };

    // Perform after all speech
    afterSpeech = async (_msg: string): Promise<void> => {
        // base no-op; subclasses override
    };

    // Perform the speech itself
    performSpeech = async (_msg: string): Promise<void> => {
        // base no-op; subclasses override
    };

    speak = async (msg: string): Promise<void> => {
        await this.beforeSpeech(msg);
        await this.performSpeech(msg);
        await this.afterSpeech(msg);
    };
}

export class ChatGod extends ChatGodBase {
    latestMessage: string;
    ttsManager: TTSManager;
    isSpeaking: boolean;

    // TTS Variables
    ttsVoice: AzureVoice;
    ttsStyle: AzureStyle;

    constructor(
        keyWord: string,
        onStateChange: () => void,
        isSpeaking: boolean = false,
        latestMessage: string = "Added a new chat god"
    ) {
        super(keyWord, onStateChange);
        this.isSpeaking = isSpeaking;
        this.latestMessage = latestMessage;

        // TTS settings
        this.ttsManager = new TTSManager();
        this.ttsVoice = this.ttsManager.voice;
        this.ttsStyle = this.ttsManager.style;
    }

    // Format the ChatGod in a way usable on the frontend
    serialize(): ChatGodProps {
        return {
            image: this.image,
            keyWord: this.keyWord,
            currentChatter: this.currentChatter,
            queueSize: this.chatPool.length,
            latestMessage: this.latestMessage,
            ttsVoice: this.ttsVoice,
            ttsStyle: this.ttsStyle,
            isSpeaking: this.isSpeaking,
        };
    }

    // Updates the message
    setLatestMessage(msg: string): void {
        this.latestMessage = msg;
    }

    // Changes whether the audio is currently playing for this chatgod
    // Useful for the upstream animations
    @updateGodState
    toggleSpeakingState(state: boolean): void {
        this.isSpeaking = state;
    }

    // Updates the TTS voice settings
    @updateGodState
    setTTSSettings(voice: AzureVoice, style: AzureStyle): void {
        this.ttsStyle = style;
        this.ttsVoice = voice;
        this.ttsManager.setStyle(style);
        this.ttsManager.setVoice(voice);
    }

    emitTTSMessage = async (msg: string): Promise<void> => {
        if (this.ttsManager) {
            // emit message takes the message, a callback to run when the audio is ready,
            // and a callback to run when its done
            // theres not a super clean way to sync animation and audio other than just delaying
            // the animation for a little bit
            await this.ttsManager.emitMessage(
                msg,
                async () => {
                    //await new Promise(resolve => setTimeout(resolve, 500))
                    this.toggleSpeakingState(true);
                },
                () => {
                    this.toggleSpeakingState(false);
                }
            );
        }
    };

    setCurrentChatter = async (chatter: string): Promise<void> => {
        this.currentChatter = chatter;
    };

    getNextChatter = (): string => {
        if (this.chatPool.length === 0) {
            console.warn("Chat pool is empty, staying with current chatter");
            return this.currentChatter;
        }
        return this.chatPool.shift() || this.currentChatter;
    };

    addChatterToPool = (chatter: string): void => {
        if (this.currentChatter === "NoCurrentChatter") {
            this.currentChatter = chatter;
            this.onChatterChange?.(chatter);
            this.onStateChange();
        } else {
            this.chatPool.push(chatter);
            this.onQueueJoin?.(chatter);
        }
    };

    // Handles the chat queue
    override duringInterval(): void {
        if (this.chatPool.length === 0) return;

        // Move current chatter to the back of the queue (silent, no join notification)
        this.chatPool.push(this.currentChatter);
        // Take next chatter from the front
        this.currentChatter = this.chatPool.shift()!;
        this.onChatterChange?.(this.currentChatter);
        this.onStateChange();
    }

    // Advance queue without re-adding current chatter (removes them)
    removeCurrentChatter(): void {
        if (this.chatPool.length === 0) {
            this.currentChatter = "NoCurrentChatter";
            this.onChatterChange?.(this.currentChatter);
            this.onStateChange();
            return;
        }

        this.currentChatter = this.chatPool.shift()!;
        this.onChatterChange?.(this.currentChatter);
        this.onStateChange();
    }

    // Speech process goes below here
    override beforeSpeech = async (msg: string): Promise<void> => {
        this.setLatestMessage(msg);
    };

    override performSpeech = async (msg: string): Promise<void> => {
        await this.emitTTSMessage(msg);
    };
}

export abstract class ChatGodManager<GodType extends ChatGod> {
    static ChatGodClass: typeof ChatGod = ChatGod;
    chatGods: GodType[] = [];
    keyword: string = "!joingod";
    wsManager: WSManager | null = null;
    twitchManager: TwitchManager;
    actionRegistry: ActionRegistry;

    managerContext: unknown; // This is for derivative games that use a chat god manager

    // Filled in at construction time by the @updateFromFrontend initializers.
    // Declared with `declare` so TypeScript knows about the type but doesn't
    // emit a class field that would overwrite the initializer's value.
    declare __frontendBindings?: FrontendBinding[];

    protected abstract createChatGod(keyword: string): GodType;

    /**
     * @param twitchManager - Optional injected platform manager. Tests pass a
     *   real `TwitchManager` constructed with `{ autoConnect: false }` (or a
     *   compatible fake) so they don't dial Twitch. Production callers omit
     *   this and a default `TwitchManager` is constructed.
     */
    constructor(
        server: http.Server | null = null,
        managerContext: unknown = null,
        twitchManager?: TwitchManager,
    ) {
        console.log("Attempting to start Chat God Manager");
        this.managerContext = managerContext;

        // Set up the platform manager + action layer BEFORE creating gods so
        // createInitialGods overrides can register Actions for them as they go.
        this.twitchManager = twitchManager ?? new TwitchManager();
        this.actionRegistry = new ActionRegistry([this.twitchManager]);

        this.createInitialGods();
        for (const god of this.chatGods) {
            this.registerJoinAction(god);
        }

        // Stateful "current chatter speaks → TTS" routing happens via
        // `processMessage`, the subclass extension point. The keyword gate
        // here prevents downstream `processMessage` overrides from
        // double-handling join commands the Action layer already routed.
        this.twitchManager.onChat(({ user, message }) => {
            if (this.isJoinKeyword(message)) return;
            this.processMessage(message, user);
        });

        // Defer until after construction completes so that the @updateFromFrontend
        // method decorator initializers have populated this.__frontendBindings.
        // Stage-3 decorator initializers run after the constructor body of the
        // class that owns them, so we can't read them synchronously here.
        queueMicrotask(() => this.initFrontendConnection(server));
    }

    // Register an Action that joins the chatter to this god's pool when their
    // message starts with the god's full keyword as a whole word (so
    // "!joingod1" matches but "!joingod10" does not).
    private registerJoinAction(god: GodType): void {
        const action = new Action(
            `chatgod-join-${god.keyWord}`,
            [{
                source: { platform: "twitch", kind: "chat" },
                filters: [{ field: "message", op: "startsWithWord", value: god.keyWord }],
            }],
            [(firing: TriggerFiring) => {
                const { user } = firing.input as TwitchChatTriggerInput;
                god.addChatterToPool(user);
                console.log(`${user} added to ${god.keyWord} pool`);
            }],
        );
        this.actionRegistry.register(action);
    }

    private isJoinKeyword(message: string): boolean {
        const firstWord = message.split(" ")[0];
        return firstWord !== undefined && firstWord.startsWith(this.keyword);
    }

    // Creates a keyword based on index
    getKeyword = (idx: number): string => `!joingod${idx}`;

    // Finds a ChatGod by its keyword
    getChatGodByKeyword = (keyword: string): GodType | undefined => {
        return this.chatGods.find((god) => god.keyWord === keyword);
    };

    // Finds a ChatGod by the chatter
    getChatGodByChatter = (chatter: string): GodType | undefined => {
        return this.chatGods.find((god) => god.currentChatter === chatter);
    };

    serializeChatGods = (): ChatGodProps[] => {
        return this.chatGods.map((g) => g.serialize());
    };

    // Updates the chat gods to the frontend
    emitChatGods(): void {
        this.wsManager!.emitChatGods(this.serializeChatGods());
    }

    @updateFromFrontend("get-chatgods")
    respondChatGods(_data: unknown): void {
        this.emitChatGods();
    }

    // Add a new blank chatgod to the list
    @updateFromFrontend("new-chatgod")
    addChatGod(_data: unknown): void {
        const newChatGod = this.createChatGod(this.getKeyword(this.chatGods.length + 1));
        this.chatGods.push(newChatGod);
        this.registerJoinAction(newChatGod);
        this.emitChatGods();
    }

    @updateFromFrontend("set-chatter")
    setChatter(data: { keyWord: string; chatter: string }): void {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.setCurrentChatter(data.chatter);
    }

    @updateFromFrontend("set-voice-speaker")
    setVoiceSpeaker(data: { keyWord: string; voice: AzureVoice }): void {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        if (chatGod) chatGod.setTTSSettings(data.voice, chatGod.ttsStyle);
    }

    @updateFromFrontend("set-voice-style")
    setVoiceStyle(data: { keyWord: string; style: AzureStyle }): void {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        if (chatGod) chatGod.setTTSSettings(chatGod.ttsVoice, data.style);
    }

    @updateFromFrontend("delete-chatgod")
    deleteChatGod(data: { keyWord: string }): void {
        this.chatGods = this.chatGods.filter((chatGod) => chatGod.keyWord !== data.keyWord);
        this.actionRegistry.unregister(`chatgod-join-${data.keyWord}`);
    }

    @updateFromFrontend("advance-queue")
    advanceQueue(data: { keyWord: string }): void {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.duringInterval();
    }

    @updateFromFrontend("remove-from-queue")
    removeFromQueue(data: { keyWord: string }): void {
        const chatGod = this.getChatGodByKeyword(data.keyWord);
        chatGod?.removeCurrentChatter();
    }

    speakMessage(chatGod: GodType, message: string): void {
        chatGod.speak(message);
    }

    // Subclass extension point. Called by the inline `onChat` handler for
    // every chat message that ISN'T a join keyword (those are handled by
    // per-god Actions registered in `registerJoinAction`). Default behavior:
    // route to the message's current chatting god for TTS. Subclasses can
    // override to add their own chat reactions and call `super.processMessage`
    // to keep the default routing.
    processMessage(message: string, chatter: string): void {
        const chattingGod = this.getChatGodByChatter(chatter);
        if (chattingGod) this.speakMessage(chattingGod, message);
    }

    _registerFrontendListener(wsSubject: string, methodName: string): void {
        const method = (this as unknown as Record<string, unknown>)[methodName];
        if (typeof method !== "function") {
            console.warn(`Attempted to register ${methodName} but it is not a function`);
            return;
        }
        this.wsManager!.registerFrontendListener(wsSubject, method.bind(this));
    }

    registerAllFrontendListeners = (bindings: FrontendBinding[] | undefined): void => {
        // Register all of the subjects that communicate with the frontend
        if (bindings) {
            for (const { wsSubject, methodName } of bindings) {
                this._registerFrontendListener(wsSubject, methodName);
            }
        }
    };

    // Create the websocket manager
    // separate function for easy overriding later
    createWSManager(server: http.Server | null): void {
        console.log("Launching the websocket manager");
        this.wsManager = new WSManager(server);
    }

    // Prepare all websocket subjects
    setupWebsockets(server: http.Server | null): void {
        this.createWSManager(server);
        // Register all of the subjects that communicate with the frontend
        // Bindings live on the instance, populated by @updateFromFrontend initializers
        this.registerAllFrontendListeners(this.__frontendBindings);
    }

    // Setup websockets and send the chat gods if a server was provided
    initFrontendConnection(server: http.Server | null): void {
        if (server) {
            this.setupWebsockets(server);
            this.emitChatGods();
            console.log("Chat God Manager is now running");
        }
    }

    createInitialGods(): void {
        this.chatGods = [
            this.createChatGod(this.getKeyword(1)),
            this.createChatGod(this.getKeyword(2)),
            this.createChatGod(this.getKeyword(3)),
        ];
    }
}

export class DefaultChatGodManager extends ChatGodManager<ChatGod> {
    protected override createChatGod(keyword: string): ChatGod {
        return new ChatGod(keyword, this.emitChatGods.bind(this));
    }
}
