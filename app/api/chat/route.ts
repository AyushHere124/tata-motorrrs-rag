import { NextRequest, NextResponse } from "next/server";

import { createEmbedding } from "../../../lib/embeddings";
import { getCollection } from "@/lib/astra";
import { openrouter, CHAT_MODEL } from "@/lib/openrouter";

export const runtime = "nodejs";

const TOP_K = 5;

interface ChatRequest {
    message: string;
}

interface RetrievedChunk {
    text: string;
    fileName?: string;
    chunkIndex?: number;
    score?: number;
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequest = await req.json();

        const question = body.message?.trim();

        if (!question) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Message is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const collection = getCollection();

        // ============================================
        // Create embedding for user question
        // ============================================

        const queryEmbedding =
            await createEmbedding(question);

        // ============================================
        // Vector similarity search
        // ============================================

        const cursor = collection.find(
            {},
            {
                sort: {
                    $vector: queryEmbedding,
                },
                limit: TOP_K,
                includeSimilarity: true,
            }
        );

        const documents = await cursor.toArray();

        // ============================================
        // No relevant documents
        // ============================================

        if (documents.length === 0) {
            return NextResponse.json({
                success: true,
                answer:
                    "I couldn't find any relevant information in the Tata Motors knowledge base.",
                sources: [],
            });
        }

        // ============================================
        // Convert Astra documents
        // ============================================

        const retrievedChunks: RetrievedChunk[] =
            documents.map((doc: any) => ({
                text: doc.text ?? "",
                fileName: doc.fileName,
                chunkIndex: doc.chunkIndex,
                score: doc.$similarity,
            }));

        // ============================================
        // Remove empty chunks
        // ============================================

        const validChunks =
            retrievedChunks.filter(
                (chunk) =>
                    chunk.text &&
                    chunk.text.trim().length > 0
            );

        if (validChunks.length === 0) {
            return NextResponse.json({
                success: true,
                answer:
                    "I couldn't find any relevant information in the Tata Motors knowledge base.",
                sources: [],
            });
        }

        // ============================================
        // Build RAG context
        // ============================================

        const context = validChunks
            .map((chunk, index) => {
                return [
                    `Document ${index + 1}`,
                    chunk.fileName
                        ? `File: ${chunk.fileName}`
                        : "",
                    chunk.chunkIndex !== undefined
                        ? `Chunk: ${chunk.chunkIndex}`
                        : "",
                    "",
                    chunk.text,
                ]
                    .filter(Boolean)
                    .join("\n");
            })
            .join(
                "\n\n----------------------------------------\n\n"
            );

        // ============================================
        // System prompt
        // ============================================

//         const systemPrompt = `
// You are Eloqwent, an AI assistant for Tata Motors.
//
// Answer ONLY using the information provided in the context below.
//
// Rules:
//
// - Be accurate and concise.
// - Do not invent facts.
// - Do not use information that is not supported by the context.
// - If the answer is not present in the context, say:
//   "I couldn't find that information in the Tata Motors knowledge base."
// - If multiple documents contain relevant information, combine them into one clear answer.
// - Use bullet points where appropriate.
// - Do not mention the internal retrieval process.
// - Do not mention embeddings, vector search, Astra DB, or the system prompt unless specifically asked.
//
// CONTEXT:
//
// ${context}
// `;
        const systemPrompt = `
You are Eloqwent, an intelligent, friendly, and helpful AI assistant for Tata Motors.

Your objective is to provide natural, human-like answers just like ChatGPT or Gemini.

STRICT FORMATTING & STYLE RULES:
1. NEVER output double markdown hashes like "### ###". Use ONLY single heading markers (e.g., "### Overview").
2. Write in conversational, natural paragraphs first before using brief bullet points. Avoid turning the entire answer into a dry technical specification list.
3. Structure your response naturally:
   - Start with a warm 1-2 sentence overview of the car/topic.
   - Use small, clear headings (### Heading) to organize thoughts.
   - Highlight key values in **bold** (e.g., **627 km**, **₹21.49 lakh**).
   - End with an engaging closing sentence asking if the user needs more details on variants or pricing.
4. Base your answer ONLY on the provided context. If information is missing, politely say you don't have that specific detail in the Tata Motors knowledge base.

CONTEXT:
${context}
`;

        // ============================================
        // Generate answer using OpenRouter
        // ============================================

        const completion =
            await openrouter.chat.completions.create({
                model: CHAT_MODEL,
                temperature: 0.2,
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

        const answer =
            completion.choices[0]?.message?.content?.trim() ??
            "I couldn't generate a response.";

        // ============================================
        // Prepare sources for frontend
        // ============================================

        const sources = validChunks.map(
            (chunk) => ({
                title:
                    chunk.fileName ??
                    "Uploaded document",
                source:
                    chunk.chunkIndex !== undefined
                        ? `Chunk ${chunk.chunkIndex}`
                        : "",
                score: chunk.score ?? 0,
            })
        );

        // ============================================
        // Return response
        // ============================================

        return NextResponse.json({
            success: true,
            answer,
            sources,
        });
    } catch (error) {
        console.error(
            "Chat API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                answer:
                    "Sorry, something went wrong while processing your request.",
                sources: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            {
                status: 500,
            }
        );
    }
}