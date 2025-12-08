'use client'

import { motion } from 'framer-motion';

interface ChatGodImageProps {
    image: string,
    isSpeaking: boolean
};

export const ChatGodImage = ({image, isSpeaking}: ChatGodImageProps) => {
    return (
        <motion.img
            src={image}
            alt="Chat God Image"
            className='w-full h-full object-contain'
            animate={isSpeaking ? "speaking" : "idle"}
            variants={{
                idle: {
                    scaleY: 1,
                    scaleX: 1,
                },
                speaking: {
                    scaleY: [1, 0.8, 1.2, 0.9, 1.1],
                    scaleX: [1, 1.2, 0.8, 1.1, 0.9]
                }
            }}
            transition={{
                duration: 0.4,
                repeat: isSpeaking ? Infinity: 0,
                repeatType: "reverse",
                ease: "easeInOut"
            }}
            style={{ transformOrigin: "center bottom"}}
        />
    )
}
