import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIResult {
  category: string;
  sentiment_score: number;
  urgency: 'Low' | 'Medium' | 'High';
  draft: string;
}

export const AI_FAILURE_DRAFT = 'AI_TRIAGE_FAILED_HUMAN_INTERVENTION_REQUIRED';

export const AI_PLACEHOLDER_PATTERNS = [
  'thank you for contacting us',
  'received your ticket',
  'get back to you shortly',
  'team will contact you',
  'received your request',
  'processing your request',
];

/**
 * Check if the AI returned a generic placeholder
 */
export function checkIfDraftIsPlaceholder(draft: string): boolean {
  if (!draft || draft === AI_FAILURE_DRAFT) return true;
  if (draft.length < 30) return true;
  
  const lowerDraft = draft.toLowerCase();
  const matchedPatterns = AI_PLACEHOLDER_PATTERNS.filter(pattern => lowerDraft.includes(pattern));
  
  return matchedPatterns.length > 0 && draft.length < 150;
}

/**
 * Call Gemini AI to triage a ticket
 */
export async function triageTicketAI(title: string, content: string): Promise<AIResult> {
  const fallback: AIResult = {
    category: 'Technical Support',
    sentiment_score: 5,
    urgency: 'Low',
    draft: AI_FAILURE_DRAFT,
  };

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
    return fallback;
  }
  
  const keySuffix = process.env.GEMINI_API_KEY.slice(-4);
  console.log(`🔑 Using Gemini API Key ending in ...${keySuffix}`);

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-lite-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            category: { type: SchemaType.STRING },
            sentiment_score: { type: SchemaType.NUMBER },
            urgency: { type: SchemaType.STRING },
            draft: { type: SchemaType.STRING },
          },
          required: ['category', 'sentiment_score', 'urgency', 'draft'],
        },
      },
    });

    const prompt = `
      You are a professional support ticket triager.
      Analyze the following support ticket and provide a structured JSON response.
      
      CRITICAL RULES:
      1. DO NOT use generic placeholder responses or standard "Thank you for contacting us" messages.
      2. The 'draft' MUST be context-aware and specifically address the details mentioned in the user's ticket.
      3. Focus on accurately identifying the category, sentiment score (1-10), and urgency (Low, Medium, High).
      
      Ticket Title: ${title}
      Ticket Content: ${content}

      Return a JSON object with:
      - category: Billing, Technical Support, or Feature Request
      - sentiment_score: 1-10
      - urgency: Low, Medium, or High
      - draft: A custom, context-aware support draft response (DO NOT use placeholders).
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as AIResult;
  } catch (error) {
    console.error('❌ AI Triage Error:', error instanceof Error ? error.message : JSON.stringify(error));
    if (error instanceof Error && (error as any).response) {
      console.error('AI Response Error Data:', JSON.stringify((error as any).response, null, 2));
    }
    return fallback;
  }
}
