import { describe, it, expect, vi } from "vitest";
import { ChatGod } from "../ChatGodManager.js";

// ChatGod owns a small queue/pool state machine. These tests cover the core
// transitions without going through ChatGodManager or any TwitchManager.

const makeGod = (keyword = "!joingod1") => new ChatGod(keyword, () => {});

describe("ChatGod queue", () => {
    it("the first chatter to join becomes the current chatter", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        expect(god.currentChatter).toBe("alice");
        expect(god.chatPool).toHaveLength(0);
    });

    it("subsequent chatters go into the pool, not the seat", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        god.addChatterToPool("bob");
        god.addChatterToPool("carol");
        expect(god.currentChatter).toBe("alice");
        expect(god.chatPool).toEqual(["bob", "carol"]);
    });

    it("addChatterToPool fires onChatterChange when seat was empty", () => {
        const god = makeGod();
        const onChatterChange = vi.fn();
        god.onChatterChange = onChatterChange;
        god.addChatterToPool("alice");
        expect(onChatterChange).toHaveBeenCalledWith("alice");
    });

    it("addChatterToPool fires onQueueJoin (not onChatterChange) when seat is full", () => {
        const god = makeGod();
        const onChatterChange = vi.fn();
        const onQueueJoin = vi.fn();
        god.addChatterToPool("alice");
        god.onChatterChange = onChatterChange;
        god.onQueueJoin = onQueueJoin;
        god.addChatterToPool("bob");
        expect(onQueueJoin).toHaveBeenCalledWith("bob");
        expect(onChatterChange).not.toHaveBeenCalled();
    });

    it("duringInterval rotates: current chatter goes to back of pool, next promoted", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        god.addChatterToPool("bob");
        god.addChatterToPool("carol");

        god.duringInterval();
        expect(god.currentChatter).toBe("bob");
        expect(god.chatPool).toEqual(["carol", "alice"]);
    });

    it("duringInterval is a no-op when pool is empty", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        god.duringInterval();
        expect(god.currentChatter).toBe("alice");
        expect(god.chatPool).toHaveLength(0);
    });

    it("removeCurrentChatter promotes the next, dropping the old one", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        god.addChatterToPool("bob");
        god.addChatterToPool("carol");

        god.removeCurrentChatter();
        expect(god.currentChatter).toBe("bob");
        expect(god.chatPool).toEqual(["carol"]);
    });

    it("removeCurrentChatter on an empty pool resets seat to NoCurrentChatter", () => {
        const god = makeGod();
        god.addChatterToPool("alice");
        god.removeCurrentChatter();
        expect(god.currentChatter).toBe("NoCurrentChatter");
        expect(god.chatPool).toHaveLength(0);
    });
});

describe("ChatGod speech", () => {
    it("beforeSpeech updates latestMessage", async () => {
        const god = makeGod();
        await god.beforeSpeech("hello world");
        expect(god.latestMessage).toBe("hello world");
    });
});
