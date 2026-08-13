//Section 1 — Imports

import dotenv from "dotenv";

dotenv.config({
    path: ".env.local",
});
console.log("cwd =", process.cwd());

const result = dotenv.config({ path: ".env.local" });

console.log(result);

console.log(
    "ASTRA_DB_API_ENDPOINT =",
    process.env.ASTRA_DB_API_ENDPOINT
);

import fs from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import urls, { WebsiteSource } from "../data/urls";

import { getCollection } from "../lib/astra";
import { createEmbedding } from "../lib/embeddings";

//Section 2 — Configuration

const PDF_FOLDER = path.join(process.cwd(), "data", "pdf");

const JSONL_FOLDER = path.join(process.cwd(), "data", "jsonl");

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
});

//Section 3 — Types

interface RawDocument {
    text: string;
    source: string;
    category: string;
    type: "pdf" | "jsonl" | "url";
}

interface ChunkDocument extends RawDocument {
    id: string;
}

//Section 4 — Logger

function log(message: string) {
    console.log(`[loadDb] ${message}`);
}

//Section 5 — Text Cleaner

function cleanText(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

//Section 6 — PDF Loader

async function loadPdf(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath);

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(data),
    }).promise;

    let text = "";

    for (let page = 1; page <= pdf.numPages; page++) {
        const pdfPage = await pdf.getPage(page);

        const content = await pdfPage.getTextContent();

        const pageText = content.items
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ");

        text += pageText + "\n";
    }

    return cleanText(text);
}

//Section 7 — JSONL Loader

async function loadJsonl(filePath: string): Promise<string> {
    const file = await fs.readFile(filePath, "utf8");

    const lines = file.split("\n");

    let text = "";

    for (const line of lines) {
        if (!line.trim()) continue;

        try {
            const obj = JSON.parse(line);

            text += JSON.stringify(obj) + "\n";
        } catch {
            log("Skipped invalid JSON line.");
        }
    }

    return cleanText(text);
}

//Section 8 — Website Loader

async function loadWebsite(site: WebsiteSource): Promise<RawDocument> {
    log(`Scraping ${site.url}`);

    const browser = await puppeteer.launch({
        headless: true,
    });

    try {
        const page = await browser.newPage();

        await page.goto(site.url, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });

        const text = await page.evaluate(() => document.body.innerText);

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

//Section 9 — Scan PDF Folder

async function getPdfFiles(): Promise<string[]> {
    const files = await fs.readdir(PDF_FOLDER);

    return files
        .filter((file) => file.endsWith(".pdf"))
        .map((file) => path.join(PDF_FOLDER, file));
}

//Section 10 — Scan JSONL Folder

async function getJsonlFiles(): Promise<string[]> {
    const files = await fs.readdir(JSONL_FOLDER);

    return files
        .filter((file) => file.endsWith(".jsonl"))
        .map((file) => path.join(JSONL_FOLDER, file));
}

// ======================================
// Load Every PDF
// ======================================

async function loadPdfDocuments(): Promise<RawDocument[]> {
    const files = await getPdfFiles();

    const documents: RawDocument[] = [];

    for (const file of files) {
        log(`Reading PDF: ${path.basename(file)}`);

        const text = await loadPdf(file);

        if (!text.trim()) continue;

        documents.push({
            text,
            source: path.basename(file),
            category: "pdf",
            type: "pdf",
        });
    }

    return documents;
}

// ======================================
// Load Every JSONL
// ======================================

async function loadJsonlDocuments(): Promise<RawDocument[]> {
    const files = await getJsonlFiles();

    const documents: RawDocument[] = [];

    for (const file of files) {
        log(`Reading JSONL: ${path.basename(file)}`);

        const text = await loadJsonl(file);

        if (!text.trim()) continue;

        documents.push({
            text,
            source: path.basename(file),
            category: "dataset",
            type: "jsonl",
        });
    }

    return documents;
}

// ======================================
// Load Every Website
// ======================================

async function loadWebsiteDocuments(): Promise<RawDocument[]> {

    const docs: RawDocument[] = [];

    for (const site of urls) {

        try {

            const doc = await loadWebsite(site);

            docs.push(doc);

        } catch (error) {

            console.error(`Failed: ${site.url}`);

        }

    }

    return docs;

}

// ======================================
// Merge Every Source
// ======================================

async function loadAllDocuments(): Promise<RawDocument[]> {

    const pdfDocs = await loadPdfDocuments();

    const jsonDocs = await loadJsonlDocuments();

    const websiteDocs = await loadWebsiteDocuments();

    return [

        ...pdfDocs,

        ...jsonDocs,

        ...websiteDocs,

    ];

}

// ======================================
// Remove Empty Docs
// ======================================

function removeEmptyDocuments(
    docs: RawDocument[]
): RawDocument[] {

    return docs.filter((doc) => doc.text.trim().length > 100);

}

// ======================================
// Remove Duplicate Docs
// ======================================

function removeDuplicateDocuments(
    docs: RawDocument[]
): RawDocument[] {

    const seen = new Set<string>();

    return docs.filter((doc) => {

        const key = doc.text.slice(0, 500);

        if (seen.has(key)) {

            return false;

        }

        seen.add(key);

        return true;

    });

}

// ======================================
// Chunk Documents
// ======================================

async function chunkDocuments(
    docs: RawDocument[]
): Promise<ChunkDocument[]> {

    const chunks: ChunkDocument[] = [];

    for (const doc of docs) {

        const splitDocs = await splitter.createDocuments([doc.text]);

        splitDocs.forEach((chunk, index) => {

            chunks.push({

                id: crypto.randomUUID(),

                text: chunk.pageContent,

                source: doc.source,

                category: doc.category,

                type: doc.type,

            });

        });

    }

    return chunks;

}

// ======================================
// Print Statistics
// ======================================

function printStats(chunks: ChunkDocument[]) {

    log("");

    log("========== DATA SUMMARY ==========");

    log(`Chunks : ${chunks.length}`);

    log("");

}

// ======================================
// Batch Configuration
// ======================================

const BATCH_SIZE = 20;

// ======================================
// Create Embeddings
// ======================================

interface AstraVectorDocument {
    _id: string;
    text: string;
    source: string;
    category: string;
    type: string;
    $vector: number[];
}

async function embedChunks(
    chunks: ChunkDocument[]
): Promise<AstraVectorDocument[]> {

    log(`Generating embeddings for ${chunks.length} chunks...`);

    const embedded: AstraVectorDocument[] = [];

    for (let i = 0; i < chunks.length; i++) {

        const chunk = chunks[i];

        try {

            const vector = await createEmbedding(chunk.text);

            embedded.push({
                _id: chunk.id,
                text: chunk.text,
                source: chunk.source,
                category: chunk.category,
                type: chunk.type,
                $vector: vector,
            });

            if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
                log(`Embeddings: ${i + 1}/${chunks.length}`);
            }

        } catch (err) {

            console.error(`Embedding failed for ${chunk.id}`);
            console.error(err);

        }

    }

    return embedded;

}
// ======================================
// Create Batches
// ======================================

function chunkArray<T>(array: T[], size: number): T[][] {

    const batches: T[][] = [];

    for (let i = 0; i < array.length; i += size) {

        batches.push(array.slice(i, i + size));

    }

    return batches;

}

// ======================================
// Upload to Astra
// ======================================

async function uploadChunks(
    documents: AstraVectorDocument[]
) {

    const collection = await getCollection();

    const batches = chunkArray(documents, 20);

    log(`Uploading ${documents.length} vectors...`);

    for (let i = 0; i < batches.length; i++) {

        try {

            await collection.insertMany(batches[i]);

            log(`Uploaded batch ${i + 1}/${batches.length}`);

        } catch (err) {

            console.error(`Batch ${i + 1} failed`);

            console.error(err);

        }

    }

}

// ======================================
// Verify Upload
// ======================================

async function verifyUpload() {

    const collection = await getCollection();

    try {

        const result = await collection.find({}, {
            limit: 1,
        });

        log("Upload verification successful.");

        return result;

    } catch (err) {

        console.error("Verification failed.");

        console.error(err);

    }

}

// ======================================
// Summary
// ======================================

function printSummary(
    docs: RawDocument[],
    chunks: ChunkDocument[],
    embedded: AstraVectorDocument[]
) {

    log("");

    log("========== SUMMARY ==========");

    log(`Documents : ${docs.length}`);

    log(`Chunks    : ${chunks.length}`);

    log(`Vectors   : ${embedded.length}`);

    log("=============================");

}

// ======================================
// Main Pipeline
// ======================================

async function main() {

    try {

        log("=====================================");
        log("Tata Motors RAG Loader Started");
        log("=====================================");

        // -----------------------------
        // Load Documents
        // -----------------------------

        let documents = await loadAllDocuments();

        documents = removeEmptyDocuments(documents);

        documents = removeDuplicateDocuments(documents);

        log(`Loaded ${documents.length} documents.`);

        // -----------------------------
        // Chunk Documents
        // -----------------------------

        const chunks = await chunkDocuments(documents);

        log(`Generated ${chunks.length} chunks.`);

        // -----------------------------
        // Generate Embeddings
        // -----------------------------

        const embedded = await embedChunks(chunks);

        log(`Generated ${embedded.length} embeddings.`);

        // -----------------------------
        // Upload to Astra
        // -----------------------------

        await uploadChunks(embedded);

        // -----------------------------
        // Verify Upload
        // -----------------------------

        await verifyUpload();

        // -----------------------------
        // Print Summary
        // -----------------------------

        printSummary(
            documents,
            chunks,
            embedded
        );

        log("");
        log("Database successfully populated.");
        log("");

    } catch (error) {

        console.error("");
        console.error("Pipeline Failed");
        console.error(error);
        console.error("");

        process.exit(1);

    }

}

// ======================================
// Run
// ======================================

main();