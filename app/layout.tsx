import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "Tata Motors AI Assistant",
    description: "RAG Chatbot built with Next.js, Astra DB and OpenRouter",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}