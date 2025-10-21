import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import Speaker from 'speaker';
import { PassThrough } from 'stream';

const AZURE_VOICES = [
    "en-US-DavisNeural",
    "en-US-TonyNeural",
    "en-US-JasonNeural",
    "en-US-GuyNeural",
    "en-US-JaneNeural",
    "en-US-NancyNeural",
    "en-US-JennyNeural",
    "en-US-AriaNeural",
] as const;

const AZURE_VOICE_STYLES = [
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

export class TTSManager {
    voice: AzureVoice;
    style: AzureStyle;

    private speechConfig!: speechsdk.SpeechConfig;
    private synthesizer!: speechsdk.SpeechSynthesizer;

    constructor() {
        this.authenticate();
        this.voice = 'en-US-AriaNeural';
        this.style = 'cheerful';
    }

    // Authenticates the app through Azure
    authenticate = () => {
        if (!process.env.AZURE_TTS_KEY || !process.env.AZURE_TTS_REGION) {
            throw new Error("Azure TTS key or region not set in environment variables");
        }
        this.speechConfig = speechsdk.SpeechConfig.fromSubscription(
            process.env.AZURE_TTS_KEY!,
            process.env.AZURE_TTS_REGION!
        )
        this.synthesizer = new speechsdk.SpeechSynthesizer(this.speechConfig);
    }

    getSSMLText = (msg: string): string => {

        const xmlns = "http://www.w3.org/2001/10/synthesis";
        const mstts = "http://www.w3.org/2001/mstts";
        const emo = "http://www.w3.org/2009/10/emotionml";
        const lang = "en-US";

        const ssml_text = `<speak version='1.0'
            xmlns='${xmlns}'
            xmlns:mstts='${mstts}'
            xmlns:emo='${emo}'
            xml:lang='${lang}'>
            <voice name = '${this.voice}'>
                <mstts:express-as style='${this.style}'>
                    ${msg}
                </mstts:express-as>
            </voice>
        </speak>`;

        return ssml_text;
    }

    // Given an audio data stream, play it through speaker
    playAudioData = async (audioData: PassThrough) : Promise<void> => {
        return new Promise((resolve, reject) =>  {
            const speaker = new Speaker({
                channels: 1,
                bitDepth: 16,
                sampleRate: 16000
            });

            speaker.on('close', () => {resolve();})
            speaker.on('error', (error) => {reject(error);})

            // Play the stream
            audioData.pipe(speaker);
        })
    }
    // Attempt to synethsize the speech and return the audio data
    getAudioData = (ssmlText: string): Promise<PassThrough | null> => {
        return new Promise((resolve, reject) => {
            this.synthesizer.speakSsmlAsync(
                ssmlText,
                result => {
                    const { audioData } = result;

                    // since we're doing in server, consert to stream
                    const bufferStream = new PassThrough();
                    bufferStream.end(Buffer.from(audioData));
                    resolve(bufferStream)
                },
                error => {
                    console.error("Error synthesizing speech:", error);
                    resolve(null);
                }
            )
        })
    }

    // Given a message string, speak it
    emitMessage = async (msg: string): Promise<void> => {
        const ssmlText = this.getSSMLText(msg);
        const audioData = await this.getAudioData(ssmlText);
        if (!audioData) {
            console.error("Failed to synethsize audio data");
            return;
        }
        await this.playAudioData(audioData);
    }

    setVoice = (voice: AzureVoice) => {
        console.log(`Setting voice to ${voice}`)
        this.voice = voice;
    }

    setStyle = (style: AzureStyle) => {
        console.log(`Setting style to ${style}`)
        this.style = style;
    }
}
