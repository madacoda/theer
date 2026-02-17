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

/**
 * Call Gemini AI to triage a ticket
 */
export async function triageTicketAI(title: string, content: string): Promise<AIResult> {
  const fallback: AIResult = {
    category: 'Technical Support',
    sentiment_score: 5,
    urgency: 'Low',
    draft: 'Thank you for contacting us. We have received your ticket and our team will get back to you shortly.',
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
      Analyze the following support ticket and provide a structured response.
      
      Ticket Title: ${title}
      Ticket Content: ${content}

      Return a JSON object with:
      - category: Billing, Technical Support, or Feature Request
      - sentiment_score: 1-10 (1=frustrated, 10=happy)
      - urgency: Low, Medium, or High
      - draft: A polite starting response draft
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
