export interface ChatGodProps {
    image: string
    latestMessage: string;
    keyWord: string;
    currentChatter: string;
    ttsVoice: AzureVoice;
    ttsStyle: AzureStyle;
    isSpeaking: boolean;
}

export const AZURE_VOICES = [
    "en-US-DavisNeural",
    "en-US-TonyNeural",
    "en-US-JasonNeural",
    "en-US-GuyNeural",
    "en-US-JaneNeural",
    "en-US-NancyNeural",
    "en-US-JennyNeural",
    "en-US-AriaNeural",
] as const;

export const AZURE_VOICE_STYLES = [
    "angry",
    "cheerful",
    "excited",
    "hopeful",
    "sad",
    "shouting",
    "terrified",
    "unfriendly",
    "whispering"
] as const;


export type AzureVoice = typeof AZURE_VOICES[number];
export type AzureStyle = typeof AZURE_VOICE_STYLES[number];
