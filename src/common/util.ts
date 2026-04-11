import {
    AZURE_VOICES,
    AZURE_VOICE_STYLES,
    type AzureStyle,
    type AzureVoice,
} from "../common/types.js";

// Randomly pick from a given list
const randomChoice = <T>(l: readonly T[]): T => {
    return l[Math.floor(Math.random() * l.length)]!;
};

export const randomVoiceStyle = (): [AzureVoice, AzureStyle] => {
    return [randomChoice(AZURE_VOICES), randomChoice(AZURE_VOICE_STYLES)];
};
