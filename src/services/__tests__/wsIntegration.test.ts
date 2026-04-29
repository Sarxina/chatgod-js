import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket } from "socket.io-client";
import { TwitchManager } from "@sarxina/sarxina-tools";
import { ChatGod, ChatGodManager } from "../ChatGodManager.js";
import type { ChatGodProps } from "../../common/types.js";

// Concrete subclass: createChatGod wires the god's `onStateChange` to
// `emitChatGods`, so any decorated mutation (e.g. setTTSSettings via the
// `@updateGodState` decorator) auto-emits an update over the websocket.
// This matches the production DefaultChatGodManager wiring.
class TestableChatGodManager extends ChatGodManager<ChatGod> {
    protected createChatGod(keyword: string): ChatGod {
        return new ChatGod(keyword, this.emitChatGods.bind(this));
    }
}

interface Fixture {
    httpServer: HttpServer;
    manager: TestableChatGodManager;
    twitch: TwitchManager;
    client: Socket;
}

const makeFixture = async (): Promise<Fixture> => {
    const httpServer = createServer();
    const twitch = new TwitchManager({ autoConnect: false });
    const manager = new TestableChatGodManager(httpServer, null, twitch);

    // The constructor schedules `initFrontendConnection` via queueMicrotask
    // (so stage-3 decorator initializers have populated __frontendBindings
    // first). Wait for that microtask so the WSManager attaches socket.io
    // to httpServer and the @updateFromFrontend handlers are registered.
    await new Promise<void>((r) => queueMicrotask(() => r()));

    await new Promise<void>((r) => httpServer.listen(0, () => r()));
    const port = (httpServer.address() as AddressInfo).port;

    const client = ioClient(`http://localhost:${port}`, { transports: ["websocket"] });
    await new Promise<void>((r) => client.once("connect", () => r()));

    return { httpServer, manager, twitch, client };
};

const teardown = async (fx: Fixture): Promise<void> => {
    fx.client.close();
    fx.manager.wsManager?.frontendIO.close();
    await new Promise<void>((r) => fx.httpServer.close(() => r()));
};

// Wait for the next emission of `event` from the server. Times out so a
// missing emission fails fast instead of hanging the suite.
const nextEvent = <T,>(client: Socket, event: string, timeoutMs = 1000): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
        client.once(event, (data: T) => {
            clearTimeout(timer);
            resolve(data);
        });
    });

describe("ChatGodManager WS protocol", () => {
    let fx: Fixture;

    beforeEach(async () => {
        fx = await makeFixture();
    });

    afterEach(async () => {
        await teardown(fx);
    });

    it("emits chatgod-update with the full god list when the client sends get-chatgods", async () => {
        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.client.emit("get-chatgods");

        const gods = await updateP;
        expect(gods.map((g) => g.keyWord)).toEqual([
            "!joingod1",
            "!joingod2",
            "!joingod3",
        ]);
        expect(gods[0]!.currentChatter).toBe("NoCurrentChatter");
    });

    it("new-chatgod adds a god and broadcasts the new list", async () => {
        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.client.emit("new-chatgod");

        const gods = await updateP;
        expect(gods).toHaveLength(4);
        expect(gods[3]!.keyWord).toBe("!joingod4");
    });

    it("delete-chatgod removes the god (verified via subsequent get-chatgods)", async () => {
        // delete-chatgod itself does not emit. Send it, then ask for state
        // and assert the god is gone.
        fx.client.emit("delete-chatgod", { keyWord: "!joingod2" });

        // Tiny yield so the server processes the delete before our query.
        await new Promise<void>((r) => setImmediate(() => r()));

        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.client.emit("get-chatgods");
        const gods = await updateP;

        expect(gods.map((g) => g.keyWord)).toEqual(["!joingod1", "!joingod3"]);
    });

    it("set-voice-speaker auto-emits chatgod-update via the @updateGodState decorator", async () => {
        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.client.emit("set-voice-speaker", { keyWord: "!joingod1", voice: "en-US-AriaNeural" });

        const gods = await updateP;
        const god1 = gods.find((g) => g.keyWord === "!joingod1")!;
        expect(god1.ttsVoice).toBe("en-US-AriaNeural");
    });

    it("set-voice-style auto-emits chatgod-update via the @updateGodState decorator", async () => {
        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.client.emit("set-voice-style", { keyWord: "!joingod1", style: "cheerful" });

        const gods = await updateP;
        const god1 = gods.find((g) => g.keyWord === "!joingod1")!;
        expect(god1.ttsStyle).toBe("cheerful");
    });

    it("a Twitch chat firing updates god state and broadcasts via the Action layer + onStateChange", async () => {
        // Fire a chat event matching god 1's join keyword. The action layer
        // calls addChatterToPool, which (via base class machinery) updates
        // currentChatter and triggers onStateChange → emitChatGods.
        const updateP = nextEvent<ChatGodProps[]>(fx.client, "chatgod-update");
        fx.twitch.emit("chat", { user: "alice", message: "!joingod1" });

        const gods = await updateP;
        const god1 = gods.find((g) => g.keyWord === "!joingod1")!;
        expect(god1.currentChatter).toBe("alice");
    });
});
