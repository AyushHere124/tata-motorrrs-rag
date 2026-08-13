

import { getCollection } from "./astra";
import { createEmbedding } from "./embeddings";
import { openrouter, CHAT_MODEL } from "./openrouter";

// ======================================
// Types
// ======================================

export interface RetrievedChunk {
    _id: string;
    text: string;
    source: string;
    category: string;
    type: string;
    $similarity?: number;
}

export interface RagContext {
    context: string;
    sources: RetrievedChunk[];
}

export interface RagResponse {
    answer: string;
    sources: RetrievedChunk[];
}

// ======================================
// Configuration
// ======================================

const TOP_K = 5;

// ======================================
// Vector Search
// ======================================

async function retrieveChunks(question: string): Promise<RetrievedChunk[]> {
    const embedding = await createEmbedding(question);
    const collection = await getCollection();

    const cursor = collection.find(
        {},
        {
            sort: {
                $vector: embedding,
            },
            limit: TOP_K,
            includeSimilarity: true,
        }
    );

    const results = await cursor.toArray();
    return results as RetrievedChunk[];
}

// ======================================
// Build Context
// ======================================

function buildContext(chunks: RetrievedChunk[]): string {
    return chunks
        .map((chunk, index) => {
            return `
Source ${index + 1}
---------------
${chunk.text}
`;
        })
        .join("\n");
}

// ======================================
// Public Function: Retrieve Context
// ======================================

export async function retrieveContext(question: string): Promise<RagContext> {
    const chunks = await retrieveChunks(question);
    const context = buildContext(chunks);

    return {
        context,
        sources: chunks,
    };
}

// ======================================
// System Prompt Builder
// ======================================

function getSystemPrompt(context: string): string {
    return `
You are Eloqwent, an intelligent, friendly, and helpful AI assistant for Tata Motors.

Your objective is to provide natural, human-like answers just like ChatGPT or Gemini.

STRICT FORMATTING & TONE RULES:
1. Write flowing, conversational paragraphs instead of outputting long, dry lists of specs.
2. NEVER output repeated hash headers like "### ###". Use ONLY single heading tags (e.g., "### Overview").
3. Structure your response naturally:
   - Start with a warm 1-2 sentence introduction about the vehicle/topic.
   - Group information into small, logical sections using single headings.
   - Use paragraph text first, followed by short, clean bullet points where helpful.
   - Highlight important specs in **bold** (e.g., **627 km**, **₹21.49 lakh**).
   - End with a friendly, helpful closing sentence.
4. Base your answer ONLY on the provided context. If the details are missing, politely state that you couldn't find that specific detail in the Tata Motors knowledge base.

CONTEXT:
${context}
`;
}

// ======================================
// Public Function: Ask Question
// ======================================

export async function askQuestion(question: string): Promise<RagResponse> {
    const { context, sources } = await retrieveContext(question);

    const systemPrompt = getSystemPrompt(context);

    // Call OpenRouter Chat Completions API
    const response = await openrouter.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: question,
            },
        ],
    });

    let answer =
        response.choices[0]?.message?.content?.trim() ??
        "I couldn't generate an answer.";

    // Post-processing Safety Net: Remove accidental duplicate hashes like "### ###"
    answer = answer.replace(/###\s*###/g, " ");
    answer = answer.replace(/####\s*####/g, " ");

    return {
        answer,
        sources,
    };
}