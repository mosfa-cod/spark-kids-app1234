export interface QuizData {
  en: string;
  ar: string;
}

export interface StoryData {
  en: string;
  ar: string;
}

async function fetchFromApi(endpoint: string, body: object = {}): Promise<any> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      parsedError = { error: errorText };
    }
    throw new Error(parsedError.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function generateWord(arabicWord: string): Promise<string> {
  try {
    const data = await fetchFromApi("/api/generate-word", { arabicWord });
    return data.word || "Spark";
  } catch (error) {
    console.error("Error calling generate-word API:", error);
    throw error;
  }
}

export async function generateImage(englishWord: string): Promise<string | null> {
  try {
    const data = await fetchFromApi("/api/generate-image", { englishWord });
    return data.imageData || null;
  } catch (error) {
    console.error("Error calling generate-image API:", error);
    return null;
  }
}

export async function generateStory(word: string): Promise<StoryData> {
  try {
    const data = await fetchFromApi("/api/generate-story", { word });
    return data;
  } catch (error) {
    console.error("Error calling generate-story API:", error);
    return { 
      en: `The ${word} is very happy today. It likes to play with friends.`,
      ar: `الـ ${word} سعيد جداً اليوم. يحب اللعب مع الأصدقاء.`
    };
  }
}

export async function generateWordFromTopic(topic: string): Promise<string> {
  try {
    const data = await fetchFromApi("/api/generate-word-from-topic", { topic });
    return data.word || "Spark";
  } catch (error) {
    console.error("Error calling generate-word-from-topic API:", error);
    throw error;
  }
}

export async function generateQuiz(): Promise<QuizData> {
  try {
    const data = await fetchFromApi("/api/generate-quiz");
    return data;
  } catch (error) {
    console.error("Error calling generate-quiz API:", error);
    const fallbacks = [
        { en: "Apple", ar: "تفاحة" },
        { en: "Car", ar: "سيارة" },
        { en: "Sun", ar: "شمس" },
        { en: "Book", ar: "كتاب" },
        { en: "Cat", ar: "قطة" }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
