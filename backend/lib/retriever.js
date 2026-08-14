import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEmbedding } from './embeddings.js';
import { upsertVectors, queryVectorDatabase } from './pinecone.js';

/**
 * 1. Document Loader: Loads Markdown documents from knowledge-base/
 */
export function loadMarkdownKnowledgeDocs() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const kbDir = path.join(__dirname, '..', 'knowledge-base');
  const docs = [];

  if (!fs.existsSync(kbDir)) {
    console.warn(`[DocumentLoader] Directory ${kbDir} does not exist.`);
    return docs;
  }

  const files = fs.readdirSync(kbDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(kbDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract title from first H1 heading or fallback to filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const docTitle = titleMatch
        ? titleMatch[1].trim()
        : file.replace('.md', '').replace(/-/g, ' ');

      docs.push({ fileName: file, docTitle, content });
    }
  }

  return docs;
}

/**
 * 2. RecursiveCharacterTextSplitter for Markdown
 */
export function splitMarkdownText(text, chunkSize = 600, overlap = 100) {
  const separators = ['\n## ', '\n### ', '\n\n', '\n', ' '];

  function recursiveSplit(textSegment, sepIndex) {
    if (textSegment.length <= chunkSize || sepIndex >= separators.length) {
      return [textSegment.trim()].filter(Boolean);
    }

    const separator = separators[sepIndex];
    const splits = textSegment.split(separator);
    const chunks = [];
    let currentChunk = '';

    for (const split of splits) {
      const candidate = currentChunk ? currentChunk + separator + split : split;
      if (candidate.length <= chunkSize) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        if (split.length > chunkSize) {
          const subChunks = recursiveSplit(split, sepIndex + 1);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  return recursiveSplit(text, 0);
}

/**
 * 3. Index Knowledge Base into Pinecone
 */
export async function indexKnowledgeBaseToPinecone() {
  const docs = loadMarkdownKnowledgeDocs();
  const allRecords = [];

  for (const doc of docs) {
    const textChunks = splitMarkdownText(doc.content);

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const vector = await getEmbedding(chunkText);

      allRecords.push({
        id: `${doc.fileName}-chunk-${i}`,
        values: vector,
        metadata: {
          fileName: doc.fileName,
          docTitle: doc.docTitle,
          text: chunkText,
          chunkIndex: i
        }
      });
    }
  }

  if (allRecords.length > 0) {
    await upsertVectors(allRecords);
  }

  console.log(`[RAG Pipeline] Indexed ${allRecords.length} markdown chunks from ${docs.length} files.`);
  return allRecords.length;
}

/**
 * 4. Grounded Retriever: Performs semantic vector search in Pinecone
 */
export async function retrieveRelevantChunks(userQuery, topK = 3) {
  const queryVector = await getEmbedding(userQuery);
  const matches = await queryVectorDatabase(queryVector, topK);

  return matches.map(match => ({
    chunkId: match.id,
    docId: match.id,
    id: match.id,
    fileName: match.metadata.fileName,
    docTitle: match.metadata.docTitle,
    text: match.metadata.text,
    similarityScore: Math.round(match.score * 100) / 100
  }));
}

/**
 * 5. Prompt Template Generator for Grounded Gemini Responses
 */
export function buildGroundedRAGPrompt(userQuery, chunks) {
  const contextStr = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.docTitle} (${c.fileName})]\n${c.text}`)
    .join('\n\n');

  return `You are ShopAssist AI, a helpful and accurate e-commerce customer support representative.

Strict Instructions:
1. Answer the customer's query strictly based on the provided company policy excerpts below.
2. If the context does not contain enough information to answer the query, clearly state what information is missing and politely offer to transfer or create a support ticket.
3. Be concise, polite, professional, and clear. Use bullet points or bold text where appropriate.

--- RETRIEVED KNOWLEDGE CONTEXT ---
${contextStr}
-----------------------------------

Customer Query: ${userQuery}

Grounded Response:`;
}
