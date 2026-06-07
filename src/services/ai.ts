export interface QuizData {
  en: string;
  ar: string;
}

export interface StoryData {
  en: string;
  ar: string;
}

// Client-Side Fallback Child Dictionary
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

// Map Arabic keys to standard lower strings
const topicMappings: Record<string, string[]> = {
  "حيوانات": topicFallbacks.animals,
  " animals": topicFallbacks.animals,
  "فضاء": topicFallbacks.space,
  " space": topicFallbacks.space,
  "طعام": topicFallbacks.food,
  " food": topicFallbacks.food,
  "طبيعة": topicFallbacks.nature,
  " nature": topicFallbacks.nature,
  "مهن": topicFallbacks.jobs,
  " jobs": topicFallbacks.jobs,
  "مهنة": topicFallbacks.jobs
};

// Pre-compiled short stories for common words
const storyDictionary: Record<string, {en: string, ar: string}> = {
  Lion: { en: "The strong lion was sleeping under a big green tree.", ar: "كان الأسد القوي نائماً تحت شجرة خضراء كبيرة." },
  Cat: { en: "The cute cat likes playing with a sparkling yellow ball.", ar: "تحب القطة اللطيفة اللعب بكرة صفراء براقة." },
  Dog: { en: "The puppy is running in the beautiful garden very fast.", ar: "الجرو الصغير يجري في الحديقة الجميلة بسرعة كبيرة." },
  Apple: { en: "I eat a sweet red apple every happy morning.", ar: "أنا آكل تفاحة حمراء حلوة كل صباح سعيد." },
  Sun: { en: "The warm sun smiles and shines bright in the blue sky.", ar: "الشمس الدافئة تبتسم وتشرق ببريق في السماء الزرقاء." },
  Moon: { en: "The beautiful moon shines softly at the starry night.", ar: "القمر الجميل يلمع بنعومة في الليل المرصع بالنجوم." },
  Star: { en: "Look at the little star playing behind the soft cloud.", ar: "انظر إلى النجمة الصغيرة تلعب خلف السحابة الناعمة." },
  Car: { en: "The wonderful red car goes beep beep down the road.", ar: "السيارة الحمراء الرائعة تصدر صوت بيب بيب في الطريق." },
  Book: { en: "Reading a wonderful storybook makes me so smart.", ar: "قراءة كتاب قصصي رائع تجعلني ذكياً جداً." },
};

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
    console.warn("[Client Fallback] Local word generation from dictionary:");
    const trimmed = arabicWord.trim().replace(/[✨💡⭐]/g, '');
    if (childDictionary[trimmed]) {
      return childDictionary[trimmed];
    }
    for (const key of Object.keys(childDictionary)) {
      if (trimmed.includes(key) || key.includes(trimmed)) {
        return childDictionary[key];
      }
    }
    return "Spark";
  }
}

export async function generateImage(englishWord: string): Promise<string | null> {
  try {
    // If we detect static hosting on pages or failed endpoint (or localhost where server is dead),
    // we can immediately or subsequently direct fetch from pollinations to save key & bypass proxy block!
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ englishWord })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.imageData) return data.imageData;
    }
    throw new Error("API unavailable, falling back to client-direct Pollinations");
  } catch (error) {
    console.info("[Client Fallback] Generating pollinations direct image for:", englishWord);
    const randomSeed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(`cute 3D Pixar style illustration of ${englishWord}, white background, vibrant colors, isolated character, children book style`)}?width=512&height=512&nologo=true&seed=${randomSeed}`;
  }
}

export async function generateStory(word: string): Promise<StoryData> {
  try {
    const data = await fetchFromApi("/api/generate-story", { word });
    return data;
  } catch (error) {
    console.warn("[Client Fallback] Local story generation for word:", word);
    const lowercaseWord = word.trim().toLowerCase();
    const cleanWord = word.trim();
    
    // Look up in dictionary (case insensitive)
    for (const key of Object.keys(storyDictionary)) {
      if (key.toLowerCase() === lowercaseWord) {
        return storyDictionary[key];
      }
    }

    // Dynamic story template if not found
    return { 
      en: `Look at the happy little ${cleanWord}! It loves to run, play, and make children smile everyday.`,
      ar: `انظر إلى الـ ${cleanWord} الصغير السعيد! إنه يحب الجري واللعب وإدخال البهجة على الأطفال كل يوم.`
    };
  }
}

export async function generateWordFromTopic(topic: string): Promise<string> {
  try {
    const data = await fetchFromApi("/api/generate-word-from-topic", { topic });
    return data.word || "Spark";
  } catch (error) {
    console.warn("[Client Fallback] Local word from topic fallback:");
    const cleanTopic = topic.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').trim().toLowerCase();
    
    // Check custom mappings
    for (const key of Object.keys(topicMappings)) {
      if (cleanTopic === key.toLowerCase() || topic.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanTopic)) {
        const words = topicMappings[key];
        return words[Math.floor(Math.random() * words.length)];
      }
    }

    // Default global random animal words if category unrecognized
    const genericList = topicFallbacks.animals;
    return genericList[Math.floor(Math.random() * genericList.length)];
  }
}

export async function generateQuiz(): Promise<QuizData> {
  try {
    const data = await fetchFromApi("/api/generate-quiz");
    return data;
  } catch (error) {
    console.warn("[Client Fallback] Local Quiz generation:");
    const fallbacks: QuizData[] = [
      { en: "Apple", ar: "تفاحة" },
      { en: "Car", ar: "سيارة" },
      { en: "Sun", ar: "شمس" },
      { en: "Book", ar: "كتاب" },
      { en: "Cat", ar: "قطة" },
      { en: "Lion", ar: "أسد" },
      { en: "Elephant", ar: "فيل" },
      { en: "Monkey", ar: "قرد" },
      { en: "Giraffe", ar: "زرافة" },
      { en: "Dog", ar: "كلب" },
      { en: "Watermelon", ar: "بطيخة" },
      { en: "Banana", ar: "موز" },
      { en: "Star", ar: "نجمة" },
      { en: "Moon", ar: "قمر" },
      { en: "Robot", ar: "روبوت" },
      { en: "Fish", ar: "سمكة" },
      { en: "House", ar: "بيت" },
      { en: "Bird", ar: "عصفور" },
      { en: "Tree", ar: "شجرة" },
      { en: "Flower", ar: "وردة" }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
