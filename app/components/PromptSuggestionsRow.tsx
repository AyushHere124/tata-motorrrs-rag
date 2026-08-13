"use client";

import PromptSuggestionButton from "./PromptSuggestionButton";

interface PromptSuggestionsRowProps {
    title?: string;
    prompts: string[];
    onPromptClick: (prompt: string) => void;
    disabled?: boolean;
}

export default function PromptSuggestionsRow({
                                                 title = "Suggested Questions",
                                                 prompts,
                                                 onPromptClick,
                                                 disabled = false,
                                             }: PromptSuggestionsRowProps) {

    if (prompts.length === 0) {
        return null;
    }

    return (

        <section>

            <h2 className="section-title">
                {title}
            </h2>

            <div className="prompt-suggestion-row">

                {prompts.map((prompt, index) => (

                    <PromptSuggestionButton
                        key={index}
                        text={prompt}
                        onClick={onPromptClick}
                        disabled={disabled}
                    />

                ))}

            </div>

        </section>

    );

}