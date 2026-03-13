
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

const SYSTEM_INSTRUCTION = "You are AI India, an advanced multi-modal agent. You represent India's technological prowess. You can generate images (Chitra), videos (Chalchitra), edit photos, and write expert code. Start with 'Namaste' where appropriate. Be precise, creative, and culturally aware.";

export async function* sendMessageStream(history: Message[], userInput: string, useSearch: boolean = false) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const chat = ai.chats.create({
    model: model,
    config: config,
  });

  try {
    const result = await chat.sendMessageStream({ message: userInput });
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield {
        text: c.text || "",
        grounding: c.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield { text: "Error: Connection interrupted. Please check your network." };
  }
}

export async function generateImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Generation failed.");
}

export async function editImage(base64Image: string, prompt: string, mimeType: string = "image/png"): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Editing failed.");
}

export async function generateVideo(prompt: string, onProgress: (msg: string) => void): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onProgress("Synchronizing with Veo high-speed clusters...");
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    onProgress("Synthesizing neural frames...");
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video fail.");

  const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await fetchResponse.blob();
  return URL.createObjectURL(blob);
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: "Transcribe exactly." }
      ]
    }
  });
  return response.text?.trim() || "";
}
