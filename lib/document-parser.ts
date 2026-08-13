import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

function cleanText(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/\u00a0/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function parsePdf(buffer: Buffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
    }).promise;

    let text = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const pageText = content.items
            .map((item: any) =>
                "str" in item ? item.str : ""
            )
            .join(" ");

        text += pageText + "\n";
    }

    return cleanText(text);
}

async function parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({
        buffer,
    });

    return cleanText(result.value);
}

async function parseSpreadsheet(buffer: Buffer): Promise<string> {
    const workbook = XLSX.read(buffer, {
        type: "buffer",
    });

    let text = "";

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
        }) as unknown[][];

        text += `Sheet: ${sheetName}\n`;

        for (const row of rows) {
            const values = row
                .map((value) => String(value).trim())
                .filter(Boolean);

            if (values.length > 0) {
                text += values.join(" | ") + "\n";
            }
        }

        text += "\n";
    }

    return cleanText(text);
}

async function parseText(buffer: Buffer): Promise<string> {
    return cleanText(buffer.toString("utf8"));
}

export async function extractDocumentText(
    buffer: Buffer,
    fileName: string,
    mimeType?: string
): Promise<string> {
    const extension =
        fileName
            .split(".")
            .pop()
            ?.toLowerCase() ?? "";

    switch (extension) {
        case "pdf":
            return parsePdf(buffer);

        case "docx":
            return parseDocx(buffer);

        case "xlsx":
        case "xls":
        case "csv":
            return parseSpreadsheet(buffer);

        case "txt":
        case "md":
        case "json":
        case "jsonl":
        case "xml":
        case "html":
        case "htm":
            return parseText(buffer);

        default:
            if (
                mimeType?.startsWith("text/")
            ) {
                return parseText(buffer);
            }

            throw new Error(
                `Unsupported file type: .${extension}`
            );
    }
}