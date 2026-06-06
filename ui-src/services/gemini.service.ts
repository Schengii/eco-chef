import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../api-config';

export const GeminiService = {
    async generateRecipe(capturedImage: string | null, promptText: string): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
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
            console.warn("Imagen generation failed, using smart Gemini fallback keywords for loremflickr:", e);
            
            try {
                // Get 1-3 English keywords matching the food from the German title
                const prompt = `Translate this dish title "${title}" to English and return exactly 1 to 3 relevant food keywords (comma-separated). Example: "Käse-Spätzle" -> "pasta,cheese". Respond ONLY with the comma-separated keywords in lowercase, no other text.`;
                const response = await ai.models.generateContent({
                    model: "gemini-flash-latest",
                    contents: [prompt],
                });
                
                const keywords = (response.text || "").trim().toLowerCase().replace(/[^a-z,]/g, "");
                if (keywords && keywords.length > 2) {
                    console.log("Smart image keywords generated:", keywords);
                    return `https://loremflickr.com/600/400/food,${encodeURIComponent(keywords)}/all`;
                }
            } catch (err) {
                console.error("Gemini keyword translation failed:", err);
            }
            
            // Ultimate fallback
            const cleanTitle = title.replace(/[^a-zA-Z ]/g, '').split(' ').slice(0, 2).join(',');
            return `https://loremflickr.com/600/400/food,${encodeURIComponent(cleanTitle)}/all`;
        }
    }
};
