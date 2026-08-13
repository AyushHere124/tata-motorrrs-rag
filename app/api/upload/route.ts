
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { extractText as extractPdfWithUnpdf } from "unpdf";
import { createEmbeddings } from "@/lib/embeddings";
import { getCollection } from "@/lib/astra";

export const runtime = "nodejs";

async function extractPdfText(buffer: Buffer): Promise<string> {
    const { text } = await extractPdfWithUnpdf(new Uint8Array(buffer));
    return Array.isArray(text) ? text.join("\n") : text || "";
}

async function extractDocxText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

function extractExcelText(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        if (csv.trim()) {
            sheets.push(`Sheet: ${sheetName}\n${csv}`);
        }
    }
    return sheets.join("\n\n");
}

async function extractText(file: File, buffer: Buffer): Promise<string> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
        return extractPdfText(buffer);
    }
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        return extractDocxText(buffer);
    }
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        return extractExcelText(buffer);
    }
    if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".json") ||
        fileName.endsWith(".csv")
    ) {
        return buffer.toString("utf-8");
    }

    throw new Error("Unsupported file format.");
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { success: false, error: "No document was uploaded." },
                { status: 400 }
            );
        }

        if (file.size === 0) {
            return NextResponse.json(
                { success: false, error: "Uploaded document is empty." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractText(file, buffer);

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "No readable text found in document." },
                { status: 400 }
            );
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 150,
        });

        const chunks = await splitter.splitText(text);

        if (chunks.length === 0) {
            return NextResponse.json(
                { success: false, error: "Failed to generate text chunks." },
                { status: 400 }
            );
        }

        const embeddings = await createEmbeddings(chunks);
        const collection = getCollection();
        const documentId = `${file.name}-${Date.now()}`;

        const documents = chunks.map((chunk, index) => ({
            documentId,
            fileName: file.name,
            title:file.name,
            source:file.name,
            chunkIndex: index,
            text: chunk,
            $vector: embeddings[index],
            createdAt: new Date().toISOString(),
        }));

        const result = await collection.insertMany(documents);

        return NextResponse.json({
            success: true,
            message: "Document uploaded and indexed successfully.",
            fileName: file.name,
            chunks: chunks.length,
            inserted: result.insertedIds?.length ?? documents.length,
        });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to process document.",
            },
            { status: 500 }
        );
    }
}