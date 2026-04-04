import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

let geminiClient = null;

export function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Add it to server/.env");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY
    });
  }

  return geminiClient;
}
