# 🚗 Tata Motors RAG Chatbot — Eloqwent

An AI-powered **Retrieval-Augmented Generation (RAG) chatbot** built for Tata Motors information and document-based question answering.

The application combines **Next.js, OpenRouter, embeddings, and Astra DB vector search** to retrieve relevant information from a knowledge base and generate grounded responses using an LLM.

---

## ✨ Features

- 🤖 AI-powered Tata Motors chatbot
- 🔎 Retrieval-Augmented Generation (RAG)
- 🧠 Vector embeddings for semantic search
- 🗄️ Astra DB vector database
- 📄 Upload and process documents
- 📚 Supports multiple document formats
- ✂️ Automatic document chunking
- 🔢 Batch embedding generation
- 🔍 Vector similarity search
- 💬 Context-aware AI responses
- 📝 Conversation history stored locally
- 💡 Suggested questions
- 📁 Document metadata storage
- 🔐 Google authentication using NextAuth
- ⚡ Built with Next.js App Router
- 🎨 Responsive chatbot interface

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      User            │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js Frontend   │
                         │      Eloqwent UI     │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴───────────┐
                         │                      │
                         ▼                      ▼
                 ┌───────────────┐      ┌────────────────┐
                 │ Document      │      │ Chat Question  │
                 │ Upload        │      │                │
                 └───────┬───────┘      └───────┬────────┘
                         │                       │
                         ▼                       ▼
                 ┌───────────────┐      ┌────────────────┐
                 │ Text          │      │ Create Query   │
                 │ Extraction    │      │ Embedding      │
                 └───────┬───────┘      └───────┬────────┘
                         │                       │
                         ▼                       ▼
                 ┌───────────────┐      ┌────────────────┐
                 │ Text          │      │ Astra DB       │
                 │ Chunking      │      │ Vector Search  │
                 └───────┬───────┘      └───────┬────────┘
                         │                       │
                         ▼                       ▼
                 ┌───────────────┐      ┌────────────────┐
                 │ Embeddings    │      │ Relevant       │
                 │ Generation    │      │ Chunks         │
                 └───────┬───────┘      └───────┬────────┘
                         │                       │
                         └──────────┬────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     OpenRouter       │
                         │       LLM            │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Grounded Response   │
                         │     to the User      │
                         └──────────────────────┘