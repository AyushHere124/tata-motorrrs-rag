
"use client";

import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from "react";
import Link from "next/link";
import "./chat.css";

import PromptSuggestionsRow from "../components/PromptSuggestionsRow";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    time: string;
};

type Conversation = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
};

type ChatResponse = {
    success?: boolean;
    answer?: string;
    error?: string;
    sources?: {
        title: string;
        source: string;
        score: number;
    }[];
};

type UploadResponse = {
    success?: boolean;
    message?: string;
    error?: string;
    chunks?: number;
};

const SUGGESTED_QUESTIONS = [
    "What is Tata Motors' current valuation?",
    "What are Tata Motors' vision and mission?",
    "What are Tata Motors' major business segments?",
    "What are the latest Tata Motors technologies?",
    "What are Tata Motors' main products?",
];

function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function createConversation(): Conversation {
    return {
        id: crypto.randomUUID(),
        title: "New conversation",
        messages: [
            {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "Hello, I'm Eloqwent. Ask me anything about Tata Motors, its vehicles, technology, business, or your uploaded documents.",
                time: getCurrentTime(),
            },
        ],
        createdAt: Date.now(),
    };
}

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState("");
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(
        null
    );

    const [isUploading, setIsUploading] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeConversation =
        conversations.find(
            (conversation) => conversation.id === activeId
        ) ?? null;

    useEffect(() => {
        try {
            const saved = localStorage.getItem(
                "eloqwent-conversations"
            );

            if (saved) {
                const parsed: Conversation[] =
                    JSON.parse(saved);

                if (parsed.length > 0) {
                    setConversations(parsed);
                    setActiveId(parsed[0].id);
                    return;
                }
            }
        } catch {
            console.warn(
                "Unable to load saved conversations."
            );
        }

        const conversation = createConversation();

        setConversations([conversation]);
        setActiveId(conversation.id);
    }, []);

    useEffect(() => {
        if (conversations.length === 0) return;

        localStorage.setItem(
            "eloqwent-conversations",
            JSON.stringify(conversations)
        );
    }, [conversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [activeConversation?.messages, isLoading]);

    function updateConversation(
        conversationId: string,
        updater: (
            conversation: Conversation
        ) => Conversation
    ) {
        setConversations((previous) =>
            previous.map((conversation) =>
                conversation.id === conversationId
                    ? updater(conversation)
                    : conversation
            )
        );
    }

    function createNewChat() {
        const conversation = createConversation();

        setConversations((previous) => [
            conversation,
            ...previous,
        ]);

        setActiveId(conversation.id);
        setQuestion("");
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    }

    function selectConversation(id: string) {
        setActiveId(id);
        setQuestion("");
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function sendQuestion(customQuestion?: string) {
        const finalQuestion = (
            customQuestion ?? question
        ).trim();

        if (
            !finalQuestion ||
            isLoading ||
            !activeConversation
        ) {
            return;
        }

        const conversationId = activeConversation.id;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: finalQuestion,
            time: getCurrentTime(),
        };

        updateConversation(
            conversationId,
            (conversation) => ({
                ...conversation,
                title:
                    conversation.messages.length <= 1
                        ? finalQuestion.slice(0, 42)
                        : conversation.title,
                messages: [
                    ...conversation.messages,
                    userMessage,
                ],
            })
        );

        setQuestion("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: finalQuestion,
                }),
            });

            const data: ChatResponse =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error ||
                    "Something went wrong while contacting Eloqwent."
                );
            }

            const answer =
                data.answer ||
                "I couldn't find an answer for that question.";

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: answer,
                time: getCurrentTime(),
            };

            updateConversation(
                conversationId,
                (conversation) => ({
                    ...conversation,
                    messages: [
                        ...conversation.messages,
                        assistantMessage,
                    ],
                })
            );
        } catch (error) {
            console.error(
                "Eloqwent Chat Error:",
                error
            );

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unable to connect to Eloqwent.";

            updateConversation(
                conversationId,
                (conversation) => ({
                    ...conversation,
                    messages: [
                        ...conversation.messages,
                        {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content:
                                `Sorry, something went wrong. ${errorMessage}`,
                            time: getCurrentTime(),
                        },
                    ],
                })
            );
        } finally {
            setIsLoading(false);

            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        }
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLTextAreaElement>
    ) {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            if (
                !isLoading &&
                question.trim()
            ) {
                sendQuestion();
            }

            return;
        }
    }

    function handleSuggestionClick(prompt: string) {
        setQuestion(prompt);

        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    }

    /*
     * ==========================================
     * DOCUMENT UPLOAD
     * ==========================================
     *
     * Step 4:
     *
     * Frontend sends the selected document to:
     *
     * POST /api/upload
     *
     * The backend will later perform:
     *
     * Step 5 -> extraction + chunking
     * Step 6 -> embedding + Astra DB insertion
     */

    async function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setSelectedFile(file);
        setIsLoading(true);

        try {
            const formData = new FormData();

            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error ||
                    "Failed to upload document."
                );
            }

            const uploadMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    `Document "${file.name}" uploaded successfully.\n\n` +
                    `I extracted and indexed ${data.chunks} chunks into the Tata Motors knowledge base.`,
                time: getCurrentTime(),
            };

            if (activeConversation) {
                updateConversation(
                    activeConversation.id,
                    (conversation) => ({
                        ...conversation,
                        messages: [
                            ...conversation.messages,
                            uploadMessage,
                        ],
                    })
                );
            }

        } catch (error) {
            console.error(
                "Document upload error:",
                error
            );

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unable to upload document.";

            if (activeConversation) {
                updateConversation(
                    activeConversation.id,
                    (conversation) => ({
                        ...conversation,
                        messages: [
                            ...conversation.messages,
                            {
                                id: crypto.randomUUID(),
                                role: "assistant",
                                content:
                                    `Document upload failed.\n\n${errorMessage}`,
                                time: getCurrentTime(),
                            },
                        ],
                    })
                );
            }

        } finally {
            setIsLoading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        }
    }

    function removeSelectedFile() {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function clearHistory() {
        const conversation = createConversation();

        setConversations([conversation]);
        setActiveId(conversation.id);
        setQuestion("");
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <main className="eloqwent-page">

            <div className="chat-background" />

            {/* HEADER */}

            <header className="eloqwent-header">

                <div className="brand">

                    <div className="robot-logo">
                        <span />
                        <span />
                    </div>

                    <div className="brand-text">

                        <div className="brand-name">
                            Eloqwent
                        </div>

                        <div className="brand-subtitle">
                            AI MOBILITY ASSISTANT
                        </div>

                    </div>

                </div>

                <Link
                    href="/"
                    className="home-button"
                >
                    ← Home
                </Link>

            </header>

            {/* MAIN LAYOUT */}

            <div
                className={`chat-layout ${
                    !isSidebarOpen
                        ? "sidebar-hidden"
                        : ""
                }`}
            >

                {/* SIDEBAR */}

                <aside className="chat-sidebar">

                    <button
                        className="new-chat-button"
                        onClick={createNewChat}
                        type="button"
                    >
                        <span className="plus-icon">
                            ＋
                        </span>

                        <span>
                            New conversation
                        </span>
                    </button>

                    <div className="history-title">
                        CHAT HISTORY
                    </div>

                    <div className="history-list">

                        {conversations.length === 0 && (
                            <div className="empty-history">
                                Your conversations will appear here.
                            </div>
                        )}

                        {conversations.map(
                            (conversation) => (
                                <button
                                    key={conversation.id}
                                    className={`history-item ${
                                        conversation.id ===
                                        activeId
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        selectConversation(
                                            conversation.id
                                        )
                                    }
                                    type="button"
                                >
                                    <span className="history-dot" />

                                    <span className="history-item-content">

                                        <span className="history-item-title">
                                            {
                                                conversation.title
                                            }
                                        </span>

                                        <span className="history-item-time">
                                            {new Date(
                                                conversation.createdAt
                                            ).toLocaleDateString(
                                                [],
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                }
                                            )}
                                        </span>

                                    </span>

                                </button>
                            )
                        )}

                    </div>

                    <button
                        className="clear-history-button"
                        onClick={clearHistory}
                        type="button"
                    >
                        Clear history
                    </button>

                    <div className="sidebar-brand">

                        <div className="mini-robot">
                            <span />
                            <span />
                        </div>

                        <div>

                            <strong>
                                Eloqwent Online
                            </strong>

                            <small>
                                Tata Motors RAG
                            </small>

                        </div>

                    </div>

                </aside>

                {/* CHAT PANEL */}

                <section className="chat-panel">

                    {/* SIDEBAR TOGGLE */}

                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={() =>
                            setIsSidebarOpen(
                                (previous) => !previous
                            )
                        }
                        aria-label={
                            isSidebarOpen
                                ? "Hide chat history"
                                : "Show chat history"
                        }
                        title={
                            isSidebarOpen
                                ? "Hide chat history"
                                : "Show chat history"
                        }
                    >
                        {isSidebarOpen ? "‹" : "›"}
                    </button>

                    {/* COMPACT HEADER */}

                    <div className="chat-panel-header">

                        <div className="online-status">

                            <span className="status-dot" />

                            ELOQWENT ONLINE

                        </div>

                        <h3>
                            Intelligence for{" "}
                            <span>
                                mobility.
                            </span>
                        </h3>

                        <p>
                            Ask questions about Tata Motors,
                            explore its knowledge base, or
                            upload your own documents.
                        </p>

                    </div>

                    {/* MESSAGES */}

                    <div className="messages-area">

                        {activeConversation?.messages.map(
                            (message) => (
                                <div
                                    key={message.id}
                                    className={`message-row ${
                                        message.role ===
                                        "user"
                                            ? "user-row"
                                            : "assistant-row"
                                    }`}
                                >

                                    {message.role ===
                                        "assistant" && (
                                            <div className="message-robot">
                                                <span />
                                                <span />
                                            </div>
                                        )}

                                    <div
                                        className={`message-bubble ${
                                            message.role ===
                                            "user"
                                                ? "user-message"
                                                : "assistant-message"
                                        }`}
                                    >

                                        <div className="message-content">
                                            {
                                                message.content
                                            }
                                        </div>

                                        <div className="message-time">
                                            {
                                                message.time
                                            }
                                        </div>

                                    </div>

                                </div>
                            )
                        )}

                        {/* SUGGESTIONS */}

                        {activeConversation?.messages.length ===
                            1 &&
                            !isLoading && (
                                <div className="suggestions-container">

                                    <PromptSuggestionsRow
                                        title="Try asking Eloqwent"
                                        prompts={
                                            SUGGESTED_QUESTIONS
                                        }
                                        onPromptClick={
                                            handleSuggestionClick
                                        }
                                        disabled={
                                            isLoading ||
                                            isUploading
                                        }
                                    />

                                </div>
                            )}

                        {/* TYPING INDICATOR */}

                        {isLoading && (
                            <div className="message-row assistant-row">

                                <div className="message-robot">
                                    <span />
                                    <span />
                                </div>

                                <div className="message-bubble assistant-message typing-bubble">

                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />

                                </div>

                            </div>
                        )}

                        <div ref={messagesEndRef} />

                    </div>

                    {/* COMPOSER */}

                    <div className="composer-section">

                        {/* SELECTED FILE */}

                        {selectedFile && (
                            <div className="selected-file">

                                <div className="file-info">

                                    <span className="file-icon">
                                        ▣
                                    </span>

                                    <div>

                                        <strong>
                                            {
                                                selectedFile.name
                                            }
                                        </strong>

                                        <small>
                                            {(
                                                selectedFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </small>

                                    </div>

                                </div>

                                <button
                                    onClick={
                                        removeSelectedFile
                                    }
                                    className="remove-file"
                                    aria-label="Remove file"
                                    type="button"
                                    disabled={isUploading}
                                >
                                    ×
                                </button>

                            </div>
                        )}

                        <div className="composer">

                            {/* UPLOAD */}

                            <button
                                className="upload-button"
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    isUploading ||
                                    isLoading
                                }
                            >

                                <span className="upload-icon">
                                    {isUploading
                                        ? "…"
                                        : "↑"}
                                </span>

                                <span>
                                    {isUploading
                                        ? "Uploading..."
                                        : "Upload Document"}
                                </span>

                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden-file-input"
                                accept=".pdf,.txt,.doc,.docx,.csv,.json,.md,.xlsx,.xls"
                                onChange={
                                    handleFileChange
                                }
                            />

                            {/* QUESTION */}

                            <textarea
                                ref={textareaRef}
                                value={question}
                                onChange={(event) =>
                                    setQuestion(
                                        event.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Eloqwent anything..."
                                rows={1}
                                disabled={
                                    isLoading ||
                                    isUploading
                                }
                            />

                            {/* SEND */}

                            <button
                                className={`send-button ${
                                    question.trim()
                                        ? "ready"
                                        : ""
                                }`}
                                onClick={() =>
                                    sendQuestion()
                                }
                                disabled={
                                    !question.trim() ||
                                    isLoading ||
                                    isUploading
                                }
                                aria-label="Send message"
                                type="button"
                            >
                                ↑
                            </button>

                        </div>

                        <div className="composer-hint">

                            <span>
                                Enter to send
                            </span>

                            <span>
                                •
                            </span>

                            <span>
                                Shift + Enter for new line
                            </span>

                            {isUploading && (
                                <>
                                    <span>
                                        •
                                    </span>

                                    <span>
                                        Processing document...
                                    </span>
                                </>
                            )}

                        </div>

                    </div>

                    <div className="panel-footer">

                        Powered by Tata Motors RAG

                        <span>
                            •
                        </span>

                        Your intelligent mobility companion

                    </div>

                </section>

            </div>

        </main>
    );
}