"use client";

import Image from "next/image";

interface ChatMessageProps {
    role: "user" | "assistant";
    message: string;
}

export default function ChatMessage({
                                        role,
                                        message,
                                    }: ChatMessageProps) {

    return (

        <div
            style={{
                display: "flex",
                justifyContent:
                    role === "user"
                        ? "flex-end"
                        : "flex-start",
                alignItems: "flex-end",
                gap: "10px",
                width: "100%",
            }}
        >

            {role === "assistant" && (

                <Image
                    src="/assets/logo.png"
                    alt="Tata Motors"
                    width={42}
                    height={42}
                    className="logo"
                />

            )}

            <div
                className={`message ${
                    role === "user"
                        ? "user"
                        : "assistant"
                }`}
            >
                {message
                    .split("\n")
                    .map((line, index) => (

                        <p
                            key={index}
                            style={{
                                marginBottom:
                                    index ===
                                    message.split("\n").length - 1
                                        ? 0
                                        : "10px",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {line}
                        </p>

                    ))}
            </div>

        </div>

    );

}