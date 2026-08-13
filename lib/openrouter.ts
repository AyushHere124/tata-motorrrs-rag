

import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
    throw new Error(" OPENROUTER_API_KEY is missing in .env.local");
}

export const openrouter = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Tata Motors RAG Chatbot",
    },
});

export const EMBEDDING_MODEL =
    process.env.EMBEDDING_MODEL ||
    "nvidia/nemotron-3-embed-1b:free";

export const CHAT_MODEL =
    process.env.LLM_MODEL ||
    "openai/gpt-oss-20b";