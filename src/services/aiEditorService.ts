import { GoogleGenAI } from '@google/genai';

export interface AiEditOptions {
  content: string;
  instruction?: string;
  mode?:
    | 'proofread'
    | 'improve_flow'
    | 'professional'
    | 'academic'
    | 'casual'
    | 'concise'
    | 'engaging'
    | 'summarize'
    | 'expand'
    | 'paraphrase'
    | 'bullets_to_text'
    | 'text_to_bullets'
    | 'clean_filler_words'
    | 'custom';
  strength?: 'light' | 'medium' | 'strong';
  tone?: 'professional' | 'casual' | 'academic' | 'friendly' | 'formal' | 'concise' | 'engaging' | 'original';
  targetLanguage?: 'ne' | 'en' | 'bilingual' | 'original';
}

export interface AiEditResult {
  editedContent: string;
  originalContent: string;
  wordCountBefore: number;
  wordCountAfter: number;
  charCountBefore: number;
  charCountAfter: number;
  tokensEstimated: number;
  model: string;
  appliedMode: string;
  appliedTone: string;
  appliedStrength: string;
}

const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Build rigorous system instructions based on editing parameters
 */
function buildSystemInstruction(options: AiEditOptions): string {
  const { strength = 'medium', tone = 'original', targetLanguage = 'original', mode = 'proofread' } = options;

  let strengthGuide = '';
  if (strength === 'light') {
    strengthGuide =
      'STRENGTH: LIGHT. Only fix objective errors (grammar, punctuation, typos, spelling). Do not rephrase sentences or change vocabulary unless grammatically incorrect. Keep sentence lengths and stylistic voice intact.';
  } else if (strength === 'strong') {
    strengthGuide =
      'STRENGTH: STRONG. Feel free to deeply restructure awkward sentences, elevate vocabulary, eliminate verbosity, and enhance narrative momentum while maintaining original core meaning and intent.';
  } else {
    strengthGuide =
      'STRENGTH: MEDIUM (BALANCED). Fix errors, smooth out awkward phrasing, improve rhythm, and polish vocabulary without altering authorial intent or personal voice.';
  }

  let toneGuide = '';
  if (tone && tone !== 'original') {
    toneGuide = `TONE REQUIREMENT: Adopt a strictly ${tone.toUpperCase()} tone throughout. Maintain proper register, terminology, and cadence appropriate for this style.`;
  }

  let languageGuide = '';
  if (targetLanguage === 'ne') {
    languageGuide =
      'OUTPUT LANGUAGE: Strictly clear, natural, grammatically standard Nepali (देवनागरी लिपि). Keep English technical or subject terms in standard transliteration or bracketed where educational convention dictates.';
  } else if (targetLanguage === 'en') {
    languageGuide = 'OUTPUT LANGUAGE: High standard, idiomatic, natural English.';
  } else if (targetLanguage === 'bilingual') {
    languageGuide =
      'OUTPUT LANGUAGE: Bilingual Nepali-English educational format, maintaining Nepali explanations with English academic/technical terms where appropriate for Nepal curriculum (SEE, +2, Lok Sewa, Entrance exams).';
  } else {
    languageGuide =
      'OUTPUT LANGUAGE: Keep the exact same language(s) as the original source input. Do not translate unless instructed.';
  }

  return `You are Editflow's master educational and professional AI editing engine.
Your mission is to edit, transform, polish, and elevate the user's provided content with surgical precision.

CRITICAL FACTUALITY & INTEGRITY DIRECTIVES:
1. NEVER fabricate facts, figures, dates, historical events, mathematical equations, or quotes.
2. PRESERVE all names of people, institutions, locations, and specific numerical data unless explicitly requested to alter them.
3. PRESERVE educational accuracy relevant to Nepali and international curricula.
4. REMOVE verbal filler words (e.g. "उम्म्", "अँ", "uh", "um", "like", "you know", "basically") when cleaning spoken lecture transcripts.
5. Return ONLY the final polished edited content. DO NOT add conversational preamble (like "Here is your edited text:", "Sure!"), commentary, or sign-offs.

${strengthGuide}
${toneGuide}
${languageGuide}
`;
}

/**
 * Split large documents safely along paragraph boundaries (double newlines)
 */
function chunkContentSafely(content: string, maxChunkLength: number = 3200): string[] {
  if (content.length <= maxChunkLength) {
    return [content];
  }

  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Core AI editing executor
 */
export async function executeAiEdit(options: AiEditOptions): Promise<AiEditResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.');
  }

  const {
    content,
    instruction,
    mode = 'proofread',
    strength = 'medium',
    tone = 'original',
    targetLanguage = 'original',
  } = options;

  if (!content || !content.trim()) {
    throw new Error('सम्पादन गर्नका लागि कुनै सामग्री प्राप्त भएन (Content is empty).');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const systemInstruction = buildSystemInstruction(options);
  const chunks = chunkContentSafely(content);
  const editedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let userPrompt = '';

    if (chunks.length > 1) {
      userPrompt += `[Processing Section ${i + 1} of ${chunks.length}. Maintain seamless transition and paragraph continuity.]\n\n`;
    }

    // Specific mode directions
    let modeInstruction = '';
    switch (mode) {
      case 'proofread':
        modeInstruction = 'Carefully proofread this text: correct spelling, punctuation, grammatical slips, and typography while preserving original voice.';
        break;
      case 'improve_flow':
        modeInstruction = 'Enhance sentence variety, transition words, and overall rhythm so the content reads smoothly and engagingly.';
        break;
      case 'professional':
        modeInstruction = 'Rewrite in a polished, authoritative, corporate/professional standard suitable for official communication and academic institutes.';
        break;
      case 'academic':
        modeInstruction = 'Rewrite in a formal academic research style, using rigorous educational diction and clear structural hierarchy.';
        break;
      case 'casual':
        modeInstruction = 'Adopt a friendly, conversational, and accessible tone while keeping explanations crystal clear.';
        break;
      case 'concise':
        modeInstruction = 'Eliminate wordiness, repetitive phrasing, and unnecessary qualifiers. Make every sentence impactful and lean.';
        break;
      case 'engaging':
        modeInstruction = 'Make the content dynamic, captivating, and inspiring for students and readers with vivid, memorable phrasing.';
        break;
      case 'summarize':
        modeInstruction = 'Provide a structured, comprehensive summary highlighting key concepts, takeaways, and exam-relevant conclusions.';
        break;
      case 'expand':
        modeInstruction = 'Elaborate thoughtfully on the core ideas, adding educational examples, clear explanations, and deeper context without fluff.';
        break;
      case 'paraphrase':
        modeInstruction = 'Rephrase the content completely in fresh, natural vocabulary while preserving the exact meaning and accuracy.';
        break;
      case 'bullets_to_text':
        modeInstruction = 'Convert these fragmented bullet points into cohesive, flowing, well-structured prose paragraphs.';
        break;
      case 'text_to_bullets':
        modeInstruction = 'Extract the vital concepts into clear, well-organized, high-yield bullet points with bold key headings.';
        break;
      case 'clean_filler_words':
        modeInstruction = 'Clean all conversational filler words (e.g. uh, um, you know, sort of, uhm, उम्म्, अँ, त्यो के भन्छ) from this lecture transcript and format into clean readable sentences.';
        break;
      default:
        modeInstruction = 'Perform high-quality editing according to the user instructions.';
    }

    if (instruction && instruction.trim()) {
      userPrompt += `SPECIFIC USER EDITING INSTRUCTION:\n"${instruction.trim()}"\n\n`;
    } else {
      userPrompt += `EDITING TASK: ${modeInstruction}\n\n`;
    }

    userPrompt += `CONTENT TO EDIT:\n\`\`\`\n${chunk}\n\`\`\``;

    const { text: rawEdited, modelUsed } = await callGeminiWithRetry(
      ai,
      GEMINI_MODEL,
      userPrompt,
      systemInstruction
    );

    const editedPart = rawEdited || chunk;
    // Clean any accidental markdown fence wrapper if returned
    const cleaned = editedPart.replace(/^```[a-z]*\n/i, '').replace(/\n```$/g, '').trim();
    editedChunks.push(cleaned);
  }


  const finalEditedContent = editedChunks.join('\n\n');

  const wordsBefore = content.trim().split(/\s+/).filter(Boolean).length;
  const wordsAfter = finalEditedContent.trim().split(/\s+/).filter(Boolean).length;
  const charsBefore = content.length;
  const charsAfter = finalEditedContent.length;
  const estimatedTokens = Math.round((charsBefore + charsAfter) / 4);

  return {
    originalContent: content,
    editedContent: finalEditedContent,
    wordCountBefore: wordsBefore,
    wordCountAfter: wordsAfter,
    charCountBefore: charsBefore,
    charCountAfter: charsAfter,
    tokensEstimated: estimatedTokens,
    model: GEMINI_MODEL,
    appliedMode: mode,
    appliedTone: tone,
    appliedStrength: strength,
  };
}
