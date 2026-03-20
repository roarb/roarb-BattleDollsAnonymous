import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(prompt: string, filename: string) {
  console.log(`Generating image for: ${prompt}`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        fs.writeFileSync(`public/${filename}`, Buffer.from(base64Data, 'base64'));
        console.log(`Saved ${filename}`);
        return;
      }
    }
    console.log(`Failed to generate ${filename} - no inlineData found`);
  } catch (e) {
    console.error(`Error generating ${filename}:`, e);
  }
}

async function main() {
  await generateImage('A grimdark sci-fi space battle with massive gothic space cathedrals firing lasers, dark and gritty, cinematic, epic, highly detailed, warhammer 40k style', 'bg-scifi.png');
  await generateImage('A massive dark fantasy battle, heavily armored knights clashing with orcs and demons, grimdark, muddy battlefield, epic scale, warhammer fantasy style', 'bg-fantasy.png');
}

main().catch(console.error);
