import { describe, it, expect, beforeEach, vi } from "vitest";
import { TwitchManager } from "@sarxina/sarxina-tools";
import { ChatGod, ChatGodManager } from "../ChatGodManager.js";

// Concrete subclass for testing — provides the abstract createChatGod and
// otherwise behaves like DefaultChatGodManager. createInitialGods is left at
// the base implementation (3 gods: !joingod1, !joingod2, !joingod3) so we
// exercise the production setup path.
class TestableChatGodManager extends ChatGodManager<ChatGod> {
    protected createChatGod(keyword: string): ChatGod {
        return new ChatGod(keyword, () => {});
    }
}

const makeManager = (): { manager: TestableChatGodManager; twitch: TwitchManager } => {
    const twitch = new TwitchManager({ autoConnect: false });
    const manager = new TestableChatGodManager(null, null, twitch);
    return { manager, twitch };
};

describe("ChatGodManager — construction", () => {
    it("uses the injected TwitchManager", () => {
        const { manager, twitch } = makeManager();
        expect(manager.twitchManager).toBe(twitch);
    });

    it("creates the three default gods (!joingod1, !joingod2, !joingod3)", () => {
        const { manager } = makeManager();
        expect(manager.chatGods.map((g) => g.keyWord)).toEqual([
            "!joingod1",
            "!joingod2",
            "!joingod3",
        ]);
    });

    it("registers an actionRegistry alongside the twitchManager", () => {
        const { manager } = makeManager();
        expect(manager.actionRegistry).toBeDefined();
    });
});

describe("ChatGodManager — join keyword routing via Actions", () => {
    let manager: TestableChatGodManager;
    let twitch: TwitchManager;

    beforeEach(() => {
        ({ manager, twitch } = makeManager());
    });

    it("a chat message of '!joingod1' makes the chatter current chatter of god 1", () => {
        twitch.emit("chat", { user: "alice", message: "!joingod1" });
        expect(manager.chatGods[0]!.currentChatter).toBe("alice");
        expect(manager.chatGods[1]!.currentChatter).toBe("NoCurrentChatter");
    });

    it("'!joingod1 hello' still matches god 1 (rest of message is ignored)", () => {
        twitch.emit("chat", { user: "alice", message: "!joingod1 some chatter babble" });
        expect(manager.chatGods[0]!.currentChatter).toBe("alice");
    });

    it("'!joingod10' does NOT match god !joingod1 (startsWithWord precision)", () => {
        twitch.emit("chat", { user: "alice", message: "!joingod10" });
        expect(manager.chatGods[0]!.currentChatter).toBe("NoCurrentChatter");
    });

    it("a non-keyword message from a current chatter routes through speakMessage", () => {
        const speakSpy = vi.spyOn(manager, "speakMessage").mockImplementation(() => {});
        twitch.emit("chat", { user: "alice", message: "!joingod1" });
        twitch.emit("chat", { user: "alice", message: "now I'm going to speak" });
        expect(speakSpy).toHaveBeenCalledWith(manager.chatGods[0], "now I'm going to speak");
    });

    it("a message from someone who isn't currently controlling any god is silently dropped", () => {
        const speakSpy = vi.spyOn(manager, "speakMessage").mockImplementation(() => {});
        twitch.emit("chat", { user: "stranger", message: "this should not speak" });
        expect(speakSpy).not.toHaveBeenCalled();
    });

    it("messages whose first token starts with the join prefix don't trigger speakMessage", () => {
        const speakSpy = vi.spyOn(manager, "speakMessage").mockImplementation(() => {});
        twitch.emit("chat", { user: "alice", message: "!joingod1" });
        // Alice now controls god 1. A '!joingod99' message should be neither
        // a join (no such god) nor a speak (gate prevents it).
        twitch.emit("chat", { user: "alice", message: "!joingod99 hi" });
        expect(speakSpy).not.toHaveBeenCalled();
    });
});

describe("ChatGodManager — dynamic god lifecycle", () => {
    it("addChatGod creates a new god AND registers a join Action for it", () => {
        const { manager, twitch } = makeManager();
        // wsManager is null in tests (no server). emitChatGods derefs it, so
        // we stub it to a no-op for this lifecycle test.
        vi.spyOn(manager, "emitChatGods").mockImplementation(() => {});
        manager.addChatGod(null);

        const newKeyword = `!joingod${manager.chatGods.length}`;
        const newGod = manager.chatGods[manager.chatGods.length - 1]!;
        expect(newGod.keyWord).toBe(newKeyword);

        twitch.emit("chat", { user: "newcomer", message: newKeyword });
        expect(newGod.currentChatter).toBe("newcomer");
    });

    it("deleteChatGod removes the god from the list", () => {
        const { manager } = makeManager();
        const before = manager.chatGods.length;
        manager.deleteChatGod({ keyWord: "!joingod2" });
        expect(manager.chatGods.length).toBe(before - 1);
        expect(manager.chatGods.find((g) => g.keyWord === "!joingod2")).toBeUndefined();
    });
});

describe("ChatGodManager — processMessage as subclass extension hook", () => {
    it("the default processMessage routes to the chatter's current god speakMessage", () => {
        const { manager, twitch } = makeManager();
        const speakSpy = vi.spyOn(manager, "speakMessage").mockImplementation(() => {});
        twitch.emit("chat", { user: "alice", message: "!joingod1" });
        manager.processMessage("anything", "alice");
        expect(speakSpy).toHaveBeenCalledWith(manager.chatGods[0], "anything");
    });

    it("processMessage is a no-op for a chatter not in any seat", () => {
        const { manager } = makeManager();
        const speakSpy = vi.spyOn(manager, "speakMessage").mockImplementation(() => {});
        manager.processMessage("anything", "stranger");
        expect(speakSpy).not.toHaveBeenCalled();
    });
});
