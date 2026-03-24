import { 
    AZURE_VOICES, 
    AZURE_VOICE_STYLES, 
    AzureStyle, 
    AzureVoice } from "../common/types"

// Randomly pick from a given list
const randomChoice = <T>(l: readonly T[]) => {
    return l[Math.floor(Math.random() * l.length)]!;
}

export const randomVoiceStyle = (): [AzureVoice, AzureStyle] => {
    return [
        randomChoice(AZURE_VOICES),
        randomChoice(AZURE_VOICE_STYLES)
    ]
}