import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback Dictionaries for kids vocabulary to guarantee flawless operation even if Gemini runs out of quota
const childDictionary: Record<string, string> = {
  "أسد": "Lion",
  "فيل": "Elephant",
  "قرد": "Monkey",
  "زرافة": "Giraffe",
  "قطة": "Cat",
  "قط": "Cat",
  "كلب": "Dog",
  "نمر": "Tiger",
  "أرنب": "Rabbit",
  "باندا": "Panda",
  "دب": "Bear",
  "عصفور": "Bird",
  "طائر": "Bird",
  "سمكة": "Fish",
  "فضاء": "Space",
  "روبوت": "Robot",
  "بطيخة": "Watermelon",
  "تفاحة": "Apple",
  "موز": "Banana",
  "برتقال": "Orange",
  "فراولة": "Strawberry",
  "سيارة": "Car",
  "طائرة": "Plane",
  "قمر": "Moon",
  "شمس": "Sun",
  "بيت": "House",
  "كتاب": "Book",
  "مدرسة": "School",
  "نجمة": "Star",
  "وردة": "Flower",
  "شجرة": "Tree",
  "لعبة": "Toy",
  "كرة": "Ball",
  "طعام": "Food",
  "حليب": "Milk",
  "ماء": "Water",
  "طبيب": "Doctor",
  "مهندس": "Engineer",
  "معلم": "Teacher"
};

const topicFallbacks: Record<string, string[]> = {
  animals: ["Lion", "Elephant", "Monkey", "Giraffe", "Tiger", "Rabbit", "Panda", "Fox", "Bear", "Zebra"],
  space: ["Star", "Moon", "Sun", "Rocket", "Astronaut", "Planet", "Spaceship", "Alien", "Galaxy", "Comet"],
  food: ["Apple", "Banana", "Watermelon", "Orange", "Strawberry", "Bread", "Cheese", "Cake", "Pizza", "Cookie"],
  nature: ["Tree", "Flower", "Cloud", "Rain", "River", "Mountain", "Grass", "Leaf", "Rainbow", "Ocean"],
  jobs: ["Doctor", "Teacher", "Pilot", "Engineer", "Farmer", "Police", "Chef", "Artist", "Astronaut", "Firefighter"]
};

// Add Arabic key aliases so they resolve correctly
topicFallbacks["حيوانات"] = topicFallbacks.animals;
topicFallbacks["فضاء"] = topicFallbacks.space;
topicFallbacks["طعام"] = topicFallbacks.food;
topicFallbacks["طبيعة"] = topicFallbacks.nature;
topicFallbacks["مهن"] = topicFallbacks.jobs;
topicFallbacks["مهنة"] = topicFallbacks.jobs;

// REST endpoints for AI operations
app.post("/api/generate-word", async (req, res) => {
  try {
    const { arabicWord } = req.body;
    if (!arabicWord) {
      res.status(400).json({ error: "arabicWord is required" });
      return;
    }

    const trimmedWord = arabicWord.trim().replace(/[✨💡⭐]/g, '');

    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Translate this Arabic word/phrase to a single English word suitable for a child. 
                Input: "${trimmedWord}". 
                Return ONLY the English word. No punctuation, no explanation.`,
              },
            ],
          },
        ],
      });

      const result = response.text?.trim() || "";
      if (result) {
        res.json({ word: result });
        return;
      }
    } catch (apiError: any) {
      console.log(`[INFO] Gemini Word Translation fallback utilized for input: ${trimmedWord}`);
    }

    // Dictionary lookup fallback
    if (childDictionary[trimmedWord]) {
      res.json({ word: childDictionary[trimmedWord] });
      return;
    }

    // Secondary heuristic lookup (checking partial matches)
    for (const key of Object.keys(childDictionary)) {
      if (trimmedWord.includes(key) || key.includes(trimmedWord)) {
        res.json({ word: childDictionary[key] });
        return;
      }
    }

    // Safe random word fallback from list
    const fallbacks = ["Teddy", "Spark", "Rainbow", "Balloon", "Butterfly", "Puppy", "Kitten", "Castle"];
    const fallbackWord = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json({ word: fallbackWord });

  } catch (err: any) {
    console.log(`[INFO] Server error in find-word, returning fallback spark`);
    res.json({ word: "Spark" });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { englishWord } = req.body;
    if (!englishWord) {
      res.status(400).json({ error: "englishWord is required" });
      return;
    }

    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Cute 3D Pixar style, high quality illustration of ${englishWord}, white background, vibrant colors, suitable for children.`,
              },
            ],
          },
        ],
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData && part.inlineData.data) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        res.json({ imageData: dataUrl });
        return;
      }
    } catch (apiError: any) {
      console.log(`[INFO] Gemini Image generation fallback utilized for: ${englishWord}`);
    }

    // High quality, fast fallback to Pollinations GenAI with kids illustration settings
    const randomSeed = Math.floor(Math.random() * 1000000);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`cute 3D Pixar style illustration of ${englishWord}, white background, vibrant colors, isolated character, children book style`)}?width=512&height=512&nologo=true&seed=${randomSeed}`;
    res.json({ imageData: fallbackUrl });

  } catch (error: any) {
    console.error("Critical server error in generate-image:", error);
    // Absolute safety net
    const fallbackDicebear = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(req.body.englishWord || "spark")}`;
    res.json({ imageData: fallbackDicebear });
  }
});

app.post("/api/generate-story", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      res.status(400).json({ error: "word is required" });
      return;
    }

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Write a very short, simple story (max 2 sentences) for a child using the word "${word}". 
              The story should be in English, and also provide an Arabic translation.
              Return ONLY a valid JSON object in this format: {"en": "English story", "ar": "Arabic translation"}.
              Do not use markdown formatting.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("No response from AI");
    }

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err: any) {
    console.log(`[INFO] Story generation fallback utilized for: ${req.body.word || "spark"}`);
    // Fallback response structurally identical
    res.json({ 
      en: `The ${req.body.word || "spark"} is very happy today. It likes to play with friends.`,
      ar: `الـ ${req.body.word || "spark"} سعيد جداً اليوم. يحب اللعب مع الأصدقاء.`
    });
  }
});

app.post("/api/generate-word-from-topic", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: "topic is required" });
      return;
    }

    const cleanTopic = topic.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').trim().toLowerCase();

    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate a single random English word suitable for a child related to the topic "${topic}".
                Return ONLY the English word. No punctuation, no explanation.`,
              },
            ],
          },
        ],
      });

      const result = response.text?.trim();
      if (result) {
        res.json({ word: result });
        return;
      }
    } catch (apiError: any) {
      console.log(`[INFO] Gemini Word From Topic API fallback utilized for topic: ${cleanTopic}`);
    }

    // List fallback
    const list = topicFallbacks[cleanTopic] || topicFallbacks.animals;
    const randomWord = list[Math.floor(Math.random() * list.length)];
    res.json({ word: randomWord });

  } catch (err: any) {
    console.log(`[INFO] Server error in generate-word-from-topic, returning fallback word`);
    res.json({ word: "Spark" });
  }
});

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const categories = ["Animals", "Fruits", "Vegetables", "Colors", "School Objects", "Home Items", "Nature", "Body Parts", "Vehicles", "Clothes", "Toys"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a random simple English word for a child from the category "${randomCategory}" and its Arabic meaning. 
              Return ONLY a valid JSON object in this format: {"en": "word", "ar": "meaning"}. 
              Do not use markdown formatting.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 1.0,
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("No response from AI");
    }
    
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err: any) {
    console.log("[INFO] Quiz generation fallback utilized");
    const fallbacks = [
        { en: "Apple", ar: "تفاحة" },
        { en: "Car", ar: "سيارة" },
        { en: "Sun", ar: "شمس" },
        { en: "Book", ar: "كتاب" },
        { en: "Cat", ar: "قطة" }
    ];
    const item = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json(item);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
