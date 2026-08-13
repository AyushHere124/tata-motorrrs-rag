"use client";

interface PromptSuggestionButtonProps {
    text: string;
    onClick: (text: string) => void;
    disabled?: boolean;
}

export default function PromptSuggestionButton({
                                                   text,
                                                   onClick,
                                                   disabled = false,
                                               }: PromptSuggestionButtonProps) {

    function handleClick() {

        if (disabled) return;

        onClick(text);

    }

    return (

        <button
            type="button"
            className="prompt-suggestion-button"
            onClick={handleClick}
            disabled={disabled}
            title={text}
        >
            {text}
        </button>

    );

}