import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../api-config';
import { StorageService } from './storage.service';

export const GeminiService = {
    async generateRecipe(capturedImage: string | null, promptText: string): Promise<string> {
        const userKey = StorageService.getGeminiApiKey();
        const apiKey = userKey || GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const requestContents: any[] = [];
        
        if (capturedImage) {
            let base64Data = '';
            let mimeType = 'image/jpeg';
            if (capturedImage.includes(',')) {
                const parts = capturedImage.split(',');
                base64Data = parts[1];
                const mimeMatch = parts[0].match(/data:(.*?);/);
                if (mimeMatch) {
                    mimeType = mimeMatch[1];
                }
            } else {
                base64Data = capturedImage;
            }
            requestContents.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }
        
        requestContents.push(promptText);
        
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: requestContents,
        });
        
        return response.text || '';
    },

    async generateRecipeImage(title: string): Promise<string> {
        const userKey = StorageService.getGeminiApiKey();
        const apiKey = userKey || GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: `A beautiful, clean studio food photography of ${title}, professional plating, high quality food shot, soft lighting, 4k`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '4:3',
                }
            });
            
            if (response && response.generatedImages && response.generatedImages[0] && response.generatedImages[0].image) {
                const base64Bytes = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64Bytes}`;
            } else {
                throw new Error("No image returned by Imagen.");
            }
        } catch (e) {
            console.warn("Imagen failed, using smart Gemini fallback keywords for loremflickr:", e);
            
            // Generate a deterministic lock number based on the recipe title
            let hash = 0;
            for (let i = 0; i < title.length; i++) {
                hash = title.charCodeAt(i) + ((hash << 5) - hash);
            }
            const lock = Math.abs(hash) % 1000;

            try {
                // Classify the title into descriptive English food tags for Flickr
                const prompt = `Translate the German food dish "${title}" to English and extract 2 to 3 descriptive comma-separated keywords (nouns/adjectives) that represent this dish for an image search (e.g. for "Spaghetti mit Tomatensoße" output "pasta,spaghetti,tomato").
Antworte AUSSCHLIESSLICH mit diesen kommagetrennten englischen Wörtern in Kleinbuchstaben, ohne Satzzeichen, ohne Anführungszeichen, ohne Zusatztext.`;
                
                const response = await ai.models.generateContent({
                    model: "gemini-flash-latest",
                    contents: [prompt],
                });
                
                const keywords = (response.text || "").trim().toLowerCase().replace(/[^a-z,]/g, "");
                if (keywords && keywords.length > 2) {
                    console.log("Smart image category classified:", keywords, "with lock:", lock);
                    return `https://loremflickr.com/600/400/food,${encodeURIComponent(keywords)}/all?lock=${lock}`;
                }
            } catch (err) {
                console.error("Gemini keyword classification failed:", err);
            }
            
            // Ultimate fallback
            return `https://loremflickr.com/600/400/food?lock=${lock}`;
        }
    }
};
