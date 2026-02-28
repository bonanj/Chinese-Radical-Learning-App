
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchCharacterInfo(characters: string[]): Promise<CharacterData[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide Pinyin and English meanings for the following Chinese characters: ${characters.join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              char: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              meaning: { type: Type.STRING },
            },
            required: ["char", "pinyin", "meaning"],
          },
        },
      },
    });

    return JSON.parse(response.text.trim()) as CharacterData[];
  } catch (error) {
    console.error("Failed to fetch character info from Gemini:", error);
    return [];
  }
}
