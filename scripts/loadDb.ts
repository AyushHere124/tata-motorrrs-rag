import dotenv from "dotenv";

dotenv.config({
    path: ".env.local",
});

import fs from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";
import { extractText as extractPdfWithUnpdf } from "unpdf";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import urls, { WebsiteSource } from "../data/urls";

import { getCollection } from "../lib/astra";
import { createEmbedding } from "../lib/embeddings";

// ======================================================
// Configuration
// ======================================================

const DATA_FOLDER = path.join(process.cwd(), "data");
const PDF_FOLDER = path.join(DATA_FOLDER, "pdf");
const JSONL_FOLDER = path.join(DATA_FOLDER, "jsonl");

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
});

// ======================================================
// Types
// ======================================================

interface RawDocument {
    text: string;
    source: string;
    category: string;
    type: "pdf" | "txt" | "jsonl" | "url";
}

interface ChunkDocument extends RawDocument {
    id: string;
}

interface AstraVectorDocument {
    _id: string;
    text: string;
    source: string;
    category: string;
    type: string;
    $vector: number[];
}

// ======================================================
// Logger
// ======================================================

function log(message: string) {
    console.log(`[loadDb] ${message}`);
}

// ======================================================
// Text Cleaner
// ======================================================

function cleanText(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// ======================================================
// PDF Loader
// ======================================================

async function loadPdf(filePath: string): Promise<string> {
    log(`Reading PDF: ${path.basename(filePath)}`);

    const data = await fs.readFile(filePath);

    const result = await extractPdfWithUnpdf(
        new Uint8Array(data)
    );

    const text = Array.isArray(result.text)
        ? result.text.join("\n")
        : result.text || "";

    return cleanText(text);
}

// ======================================================
// TXT Loader
// ======================================================

async function loadTxt(filePath: string): Promise<string> {
    log(`Reading TXT: ${path.basename(filePath)}`);

    const text = await fs.readFile(
        filePath,
        "utf8"
    );

    return cleanText(text);
}

// ======================================================
// JSONL Loader
// ======================================================

async function loadJsonl(
    filePath: string
): Promise<string> {

    const file = await fs.readFile(
        filePath,
        "utf8"
    );

    const lines = file.split("\n");

    let text = "";

    for (const line of lines) {

        if (!line.trim()) {
            continue;
        }

        try {

            const obj = JSON.parse(line);

            text +=
                JSON.stringify(obj) +
                "\n";

        } catch {

            log(
                `Skipped invalid JSON line in ${path.basename(filePath)}`
            );

        }
    }

    return cleanText(text);
}

// ======================================================
// Website Loader
// ======================================================

async function loadWebsite(
    site: WebsiteSource
): Promise<RawDocument> {

    log(`Scraping ${site.url}`);

    const browser = await puppeteer.launch({
        headless: true,
    });

    try {

        const page =
            await browser.newPage();

        await page.goto(site.url, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });

        const text =
            await page.evaluate(
                () => document.body.innerText
            );

        return {
            text: cleanText(text),
            source: site.url,
            category: site.category,
            type: "url",
        };

    } finally {

        await browser.close();

    }
}

// ======================================================
// Scan PDF Folder
// ======================================================

async function getPdfFiles(): Promise<string[]> {

    try {

        const files =
            await fs.readdir(PDF_FOLDER);

        return files
            .filter((file) =>
                file.toLowerCase().endsWith(".pdf")
            )
            .map((file) =>
                path.join(PDF_FOLDER, file)
            );

    } catch {

        return [];

    }
}

// ======================================================
// Scan TXT Files
// ======================================================

async function getTxtFiles(): Promise<string[]> {

    const files =
        await fs.readdir(DATA_FOLDER);

    return files
        .filter((file) =>
            file.toLowerCase().endsWith(".txt")
        )
        .map((file) =>
            path.join(DATA_FOLDER, file)
        );
}

// ======================================================
// Scan JSONL Folder
// ======================================================

async function getJsonlFiles(): Promise<string[]> {

    try {

        const files =
            await fs.readdir(JSONL_FOLDER);

        return files
            .filter((file) =>
                file.toLowerCase().endsWith(".jsonl")
            )
            .map((file) =>
                path.join(JSONL_FOLDER, file)
            );

    } catch {

        return [];

    }
}

// ======================================================
// Load PDF Documents
// ======================================================

async function loadPdfDocuments(): Promise<RawDocument[]> {

    const files =
        await getPdfFiles();

    const documents: RawDocument[] = [];

    for (const file of files) {

        try {

            const text =
                await loadPdf(file);

            if (!text.trim()) {

                log(
                    `Skipping empty PDF: ${path.basename(file)}`
                );

                continue;

            }

            documents.push({
                text,
                source: path.basename(file),
                category: "pdf",
                type: "pdf",
            });

        } catch (error) {

            console.error(
                `Failed to read PDF: ${path.basename(file)}`
            );

            console.error(error);

        }
    }

    return documents;
}

// ======================================================
// Load TXT Documents
// ======================================================

async function loadTxtDocuments(): Promise<RawDocument[]> {

    const files =
        await getTxtFiles();

    const documents: RawDocument[] = [];

    for (const file of files) {

        try {

            const text =
                await loadTxt(file);

            if (!text.trim()) {

                log(
                    `Skipping empty TXT: ${path.basename(file)}`
                );

                continue;

            }

            documents.push({
                text,
                source: path.basename(file),
                category: "txt",
                type: "txt",
            });

        } catch (error) {

            console.error(
                `Failed to read TXT: ${path.basename(file)}`
            );

            console.error(error);

        }
    }

    return documents;
}

// ======================================================
// Load JSONL Documents
// ======================================================

async function loadJsonlDocuments(): Promise<RawDocument[]> {

    const files =
        await getJsonlFiles();

    const documents: RawDocument[] = [];

    for (const file of files) {

        try {

            log(
                `Reading JSONL: ${path.basename(file)}`
            );

            const text =
                await loadJsonl(file);

            if (!text.trim()) {
                continue;
            }

            documents.push({
                text,
                source: path.basename(file),
                category: "dataset",
                type: "jsonl",
            });

        } catch (error) {

            console.error(
                `Failed to read JSONL: ${path.basename(file)}`
            );

            console.error(error);

        }
    }

    return documents;
}

// ======================================================
// Load Website Documents
// ======================================================

async function loadWebsiteDocuments(): Promise<RawDocument[]> {

    const docs: RawDocument[] = [];

    for (const site of urls) {

        try {

            const doc =
                await loadWebsite(site);

            if (doc.text.trim()) {
                docs.push(doc);
            }

        } catch (error) {

            console.error(
                `Failed: ${site.url}`
            );

            console.error(error);

        }
    }

    return docs;
}

// ======================================================
// Merge All Sources
// ======================================================

async function loadAllDocuments(): Promise<RawDocument[]> {

    const pdfDocs =
        await loadPdfDocuments();

    const txtDocs =
        await loadTxtDocuments();

    const jsonDocs =
        await loadJsonlDocuments();

    const websiteDocs =
        await loadWebsiteDocuments();

    return [
        ...pdfDocs,
        ...txtDocs,
        ...jsonDocs,
        ...websiteDocs,
    ];
}

// ======================================================
// Remove Empty Documents
// ======================================================

function removeEmptyDocuments(
    docs: RawDocument[]
): RawDocument[] {

    return docs.filter(
        (doc) =>
            doc.text.trim().length > 100
    );
}

// ======================================================
// Remove Duplicate Documents
// ======================================================

function removeDuplicateDocuments(
    docs: RawDocument[]
): RawDocument[] {

    const seen =
        new Set<string>();

    return docs.filter((doc) => {

        const key =
            `${doc.source}:${doc.text.slice(0, 500)}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}

// ======================================================
// Chunk Documents
// ======================================================

async function chunkDocuments(
    docs: RawDocument[]
): Promise<ChunkDocument[]> {

    const chunks: ChunkDocument[] = [];

    for (const doc of docs) {

        const splitDocs =
            await splitter.createDocuments([
                doc.text,
            ]);

        splitDocs.forEach(
            (chunk, index) => {

                chunks.push({
                    id: crypto.randomUUID(),
                    text: chunk.pageContent,
                    source: doc.source,
                    category: doc.category,
                    type: doc.type,
                });

            }
        );
    }

    return chunks;
}

// ======================================================
// Create Embeddings
// ======================================================

async function embedChunks(
    chunks: ChunkDocument[]
): Promise<AstraVectorDocument[]> {

    log(
        `Generating embeddings for ${chunks.length} chunks...`
    );

    const embedded:
        AstraVectorDocument[] = [];

    for (
        let i = 0;
        i < chunks.length;
        i++
    ) {

        const chunk =
            chunks[i];

        try {

            const vector =
                await createEmbedding(
                    chunk.text
                );

            embedded.push({
                _id: chunk.id,
                text: chunk.text,
                source: chunk.source,
                category: chunk.category,
                type: chunk.type,
                $vector: vector,
            });

            if (
                (i + 1) % 10 === 0 ||
                i === chunks.length - 1
            ) {

                log(
                    `Embeddings: ${i + 1}/${chunks.length}`
                );

            }

        } catch (error) {

            console.error(
                `Embedding failed for ${chunk.id}`
            );

            console.error(error);

        }
    }

    return embedded;
}

// ======================================================
// Create Batches
// ======================================================

function chunkArray<T>(
    array: T[],
    size: number
): T[][] {

    const batches: T[][] = [];

    for (
        let i = 0;
        i < array.length;
        i += size
    ) {

        batches.push(
            array.slice(i, i + size)
        );

    }

    return batches;
}

// ======================================================
// Upload to Astra DB
// ======================================================

async function uploadChunks(
    documents: AstraVectorDocument[]
) {

    const collection =
        getCollection();

    const batches =
        chunkArray(
            documents,
            20
        );

    log(
        `Uploading ${documents.length} vectors...`
    );

    for (
        let i = 0;
        i < batches.length;
        i++
    ) {

        try {

            await collection.insertMany(
                batches[i]
            );

            log(
                `Uploaded batch ${i + 1}/${batches.length}`
            );

        } catch (error) {

            console.error(
                `Batch ${i + 1} failed`
            );

            console.error(error);

        }
    }
}

// ======================================================
// Verify Upload
// ======================================================

async function verifyUpload() {

    const collection =
        getCollection();

    try {

        await collection.find(
            {},
            {
                limit: 1,
            }
        ).toArray();

        log(
            "Upload verification successful."
        );

        return true;

    } catch (error) {

        console.error(
            "Verification failed."
        );

        console.error(error);

        return false;
    }
}

// ======================================================
// Print Summary
// ======================================================

function printSummary(
    docs: RawDocument[],
    chunks: ChunkDocument[],
    embedded: AstraVectorDocument[]
) {

    log("");
    log(
        "========== SUMMARY =========="
    );

    log(
        `Documents : ${docs.length}`
    );

    log(
        `Chunks    : ${chunks.length}`
    );

    log(
        `Vectors   : ${embedded.length}`
    );

    log(
        "============================="
    );
}

// ======================================================
// Main Pipeline
// ======================================================

async function main() {

    try {

        log(
            "====================================="
        );

        log(
            "Tata Motors RAG Loader Started"
        );

        log(
            "====================================="
        );

        // -----------------------------
        // Load documents
        // -----------------------------

        let documents =
            await loadAllDocuments();

        documents =
            removeEmptyDocuments(
                documents
            );

        documents =
            removeDuplicateDocuments(
                documents
            );

        log(
            `Loaded ${documents.length} documents.`
        );

        if (documents.length === 0) {

            throw new Error(
                "No documents found in the data directory."
            );

        }

        // -----------------------------
        // Chunk documents
        // -----------------------------

        const chunks =
            await chunkDocuments(
                documents
            );

        log(
            `Generated ${chunks.length} chunks.`
        );

        // -----------------------------
        // Generate embeddings
        // -----------------------------

        const embedded =
            await embedChunks(
                chunks
            );

        log(
            `Generated ${embedded.length} embeddings.`
        );

        if (embedded.length === 0) {

            throw new Error(
                "No embeddings were generated."
            );

        }

        // -----------------------------
        // Upload
        // -----------------------------

        await uploadChunks(
            embedded
        );

        // -----------------------------
        // Verify
        // -----------------------------

        await verifyUpload();

        // -----------------------------
        // Summary
        // -----------------------------

        printSummary(
            documents,
            chunks,
            embedded
        );

        log("");
        log(
            "Database successfully populated."
        );
        log("");

    } catch (error) {

        console.error("");
        console.error(
            "Pipeline Failed"
        );
        console.error(error);
        console.error("");

        process.exit(1);
    }
}

// ======================================================
// Run
// ======================================================

main();
