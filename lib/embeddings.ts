import { openrouter, EMBEDDING_MODEL } from "./openrouter";

// ======================================================
// Generate embedding for a single text
// ======================================================

export async function createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error("Cannot create embedding for empty text.");
    }

    try {
        const response = await openrouter.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
            encoding_format: "float",
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error(" Failed to create embedding:", error);
        throw error;
    }
}

// ======================================================
// Generate embeddings for multiple texts
// ======================================================

export async function createEmbeddings(
    texts: string[]
): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
        const response = await openrouter.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts,
            encoding_format: "float",
        });

        return response.data.map((item) => item.embedding);
    } catch (error) {
        console.error(" Failed to create batch embeddings:", error);
        throw error;
    }
}