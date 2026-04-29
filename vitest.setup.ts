import { vi } from "vitest";

// `speaker` is a native ALSA binding that probes audio devices at import
// time. CI runners are headless and don't have a default ALSA device, so the
// import crashes the worker. We never exercise TTS playback in tests, so a
// no-op mock is the right call.
vi.mock("speaker", () => ({
    default: vi.fn().mockImplementation(() => ({
        write: () => true,
        end: () => {},
        on: () => {},
    })),
}));

// `microsoft-cognitiveservices-speech-sdk` similarly opens up some heavy
// runtime concerns on import (worker init, network probes). TTSManager
// already gates `authenticate()` on env vars, but the import itself can be
// slow / flaky in CI. Mock the bits we'd reach if anything tries to use them.
vi.mock("microsoft-cognitiveservices-speech-sdk", () => ({
    SpeechConfig: { fromSubscription: vi.fn(() => ({})) },
    SpeechSynthesizer: vi.fn().mockImplementation(() => ({
        speakSsmlAsync: vi.fn(),
        close: vi.fn(),
    })),
}));
