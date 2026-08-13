"use client";

import { KeyboardEvent, useRef } from "react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    loading?: boolean;
}

export default function ChatInput({
                                      value,
                                      onChange,
                                      onSend,
                                      loading = false,
                                  }: ChatInputProps) {

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {

        onChange(e.target.value);

        const textarea = textareaRef.current;

        if (!textarea) return;

        textarea.style.height = "56px";
        textarea.style.height = textarea.scrollHeight + "px";
    }

    function handleKeyDown(
        e: KeyboardEvent<HTMLTextAreaElement>
    ) {

        if (e.key === "Enter" && !e.shiftKey) {

            e.preventDefault();

            if (!loading && value.trim()) {
                onSend();
            }
        }
    }

    function handleSend() {

        if (loading) return;

        if (!value.trim()) return;

        onSend();

        if (textareaRef.current) {
            textareaRef.current.style.height = "56px";
        }
    }

    return (

        <div className="chat-input-wrapper">

            <div className="chat-input">

                <textarea
                    ref={textareaRef}
                    value={value}
                    placeholder="Ask anything about Tata Motors..."
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />

                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={loading || value.trim().length === 0}
                    type="button"
                    aria-label="Send"
                >
                    ➤
                </button>

            </div>

        </div>

    );

}