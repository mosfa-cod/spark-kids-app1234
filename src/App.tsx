/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Volume2, Sun, Image as ImageIcon, Trophy, Loader2, BookOpen, Lock, CheckCircle, Trash2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SparkCard } from './components/SparkCard';
import { Modal } from './components/Modal';
import { BottomNav } from './components/BottomNav';
import { generateWord, generateImage, generateQuiz, generateStory, generateWordFromTopic, QuizData, StoryData } from './services/ai';

interface WordResult {
  en: string;
  ar: string;
  img: string | null;
}

const TOPICS = [
  { id: 'animals', label: '🦁 حيوانات', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'space', label: '🚀 فضاء', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  { id: 'food', label: '🍎 طعام', color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'nature', label: '🌳 طبيعة', color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'jobs', label: '👨‍⚕️ مهن', color: 'bg-blue-100 text-blue-600 border-blue-200' },
];

const LESSONS = [
  { id: 1, title: 'Level 1: Animals', subtitle: 'تعلم أسماء الحيوانات', color: 'bg-green-500', locked: false, progress: 100 },
  { id: 2, title: 'Level 2: Colors', subtitle: 'الألوان الأساسية', color: 'bg-blue-500', locked: false, progress: 40 },
  { id: 3, title: 'Level 3: Family', subtitle: 'أفراد العائلة', color: 'bg-purple-500', locked: true, progress: 0 },
  { id: 4, title: 'Level 4: School', subtitle: 'أدوات المدرسة', color: 'bg-orange-500', locked: true, progress: 0 },
];

const SUCCESS_PHRASES = [
  { ar: "رائع! إجابة صحيحة يا بطل! ⭐", en: "Excellent work, hero! Perfect answer!" },
  { ar: "مذهل! أنت بطل خارق في الإنجليزية! 🌟", en: "Fantastic! You are an English superstar!" },
  { ar: "أحسنت صنعاً! إجابة ذكية جداً! 🎉", en: "Well done! Extremely smart answer!" },
  { ar: "ممتاز يا عبقري! إجابة صحيحة 100%! 🧠", en: "Excellent, genius! 100% correct answer!" }
];

const TRY_AGAIN_PHRASES = [
  { ar: "حاول مرة أخرى يا بطل! يمكنك فعلها 🌟", en: "Try again, hero! You got this!" },
  { ar: "خطوة واحدة نحو النجاح! فكر من جديد 🧠", en: "One step closer! Think about it again!" },
  { ar: "لا بأس يا ذكي، المحاولة تصنع المعجزات! ✨", en: "It's okay, smart friend! Practice makes perfect!" },
  { ar: "قريب جداً! جرب مرة أخرى يا بطل 👍", en: "So close! Try one more time, champion!" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'settings'>('home');
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordResult | null>(null);
  const [gallery, setGallery] = useState<WordResult[]>([]);
  const [activeModal, setActiveModal] = useState<'gallery' | 'quiz' | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Story State
  const [story, setStory] = useState<StoryData | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  // Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizInput, setQuizInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizWrongAttempts, setQuizWrongAttempts] = useState(0);

  // Quiz Helper State (Educational Coaching for Kids)
  const [showQuizHelp, setShowQuizHelp] = useState(false);
  const [quizHelpLoading, setQuizHelpLoading] = useState(false);
  const [quizHelpImage, setQuizHelpImage] = useState<string | null>(null);
  const [quizHelpStory, setQuizHelpStory] = useState<StoryData | null>(null);

  // Load gallery and theme from local storage on mount
  useEffect(() => {
    const savedGallery = localStorage.getItem('spark_gallery');
    if (savedGallery) {
      try {
        setGallery(JSON.parse(savedGallery));
      } catch (e) {
        console.error("Failed to load gallery", e);
      }
    }
    
    const savedTheme = localStorage.getItem('spark_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Save gallery to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('spark_gallery', JSON.stringify(gallery));
  }, [gallery]);

  // Save theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('spark_theme', newMode ? 'dark' : 'light');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputWord.trim()) return;
    processMagic(inputWord);
  };

  const handleTopicClick = async (topicLabel: string) => {
    const topic = topicLabel.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').trim();
    setLoading(true);
    setResult(null);
    setStory(null);
    
    try {
      const enWord = await generateWordFromTopic(topic);
      const imgData = await generateImage(enWord);
      const newResult = { en: enWord, ar: topic, img: imgData };
      setResult(newResult);
      speak(enWord);
      if (imgData) {
        setGallery(prev => [newResult, ...prev].slice(0, 50));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processMagic = async (word: string) => {
    setLoading(true);
    setResult(null);
    setStory(null);

    try {
      const enWord = await generateWord(word);
      const imgData = await generateImage(enWord);
      const newResult = { en: enWord, ar: word, img: imgData };
      setResult(newResult);
      speak(enWord);
      if (imgData) {
        setGallery(prev => [newResult, ...prev].slice(0, 50));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateStoryForWord = async () => {
    if (!result) return;
    setStoryLoading(true);
    try {
      const storyData = await generateStory(result.en);
      setStory(storyData);
      speak(storyData.en);
    } catch (error) {
      console.error(error);
    } finally {
      setStoryLoading(false);
    }
  };

  const speak = (text: string, lang: 'en' | 'ar' = 'en') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = lang === 'ar' ? 1.0 : 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startQuiz = async () => {
    setActiveModal('quiz');
    setQuizLoading(true);
    setQuizData(null);
    setQuizFeedback(null);
    setQuizInput('');
    setShowQuizHelp(false);
    setQuizHelpImage(null);
    setQuizHelpStory(null);
    setQuizHelpLoading(false);
    setQuizWrongAttempts(0);

    try {
      const data = await generateQuiz();
      setQuizData(data);
      setTimeout(() => {
        speak(data.en, 'en');
      }, 600);
    } catch (error) {
      console.error(error);
      setQuizFeedback({ msg: "Failed to load quiz", type: 'error' });
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizHelp = async () => {
    if (!quizData) return;
    setQuizHelpLoading(true);
    setShowQuizHelp(true);
    try {
      speak(quizData.en);
      const [imgData, storyData] = await Promise.all([
        generateImage(quizData.en),
        generateStory(quizData.en)
      ]);
      setQuizHelpImage(imgData);
      setQuizHelpStory(storyData);
    } catch (error) {
      console.error("Failed to load quiz help content", error);
    } finally {
      setQuizHelpLoading(false);
    }
  };

  const checkQuiz = () => {
    if (!quizData) return;
    
    if (quizInput.trim().toLowerCase() === quizData.ar.trim().toLowerCase() || 
        quizInput.trim().toLowerCase() === quizData.en.trim().toLowerCase()) {
      const phrase = SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)];
      setQuizFeedback({ msg: `${phrase.ar}\n/ ${phrase.en}`, type: 'success' });
      setQuizWrongAttempts(0);
      
      // Auto-speak English feedback first, then the word itself as reinforcement
      speak(phrase.en, 'en');
      
      setTimeout(() => {
        setActiveModal(null);
      }, 3500);
    } else {
      const nextAttempts = quizWrongAttempts + 1;
      setQuizWrongAttempts(nextAttempts);
      
      if (nextAttempts >= 2) {
        setQuizFeedback({ msg: "حاولت جيداً يا بطل! 🌟 دعنا لنتعلم الكلمة معاً الآن بالصور والقصص الجميلة!\n/ Great try, hero! Let's learn this word together with beautiful photos and stories!", type: 'error' });
        speak("Great try, hero! Let's learn this word together with beautiful photos and stories!", 'en');
        handleQuizHelp();
      } else {
        const phrase = TRY_AGAIN_PHRASES[Math.floor(Math.random() * TRY_AGAIN_PHRASES.length)];
        setQuizFeedback({ msg: `${phrase.ar}\n/ ${phrase.en}`, type: 'error' });
        speak(phrase.en, 'en');
      }
    }
  };

  const handleDailyWord = () => {
    const words = ["زرافة", "فضاء", "روبوت", "بطيخة", "طائرة", "قمر", "شمس", "قطة", "كلب", "سيارة"];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setInputWord(randomWord);
    processMagic(randomWord);
  };

  const clearGallery = () => {
    if (confirm("هل أنت متأكد من مسح جميع الصور؟")) {
      setGallery([]);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 font-tajawal bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400" dir="rtl">
      {/* Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className={`w-full max-w-[375px] h-[800px] bg-[#f8fafc] dark:bg-slate-900 rounded-[3rem] border-[12px] border-slate-900 relative overflow-hidden flex flex-col shadow-2xl ring-8 ring-black/5 transition-all duration-700 ${isDarkMode ? 'dark' : ''}`}>
        
        {/* Dynamic Background Image */}
        {result?.img && (
          <div className="absolute inset-0 z-0">
            <img 
              src={result.img} 
              alt="background" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-20 dark:opacity-10 blur-sm scale-110 transition-opacity duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/90"></div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex justify-between px-10 pt-6 items-center select-none relative z-10">
          <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">12:21</span>
        </div>

        {/* Header - Only show on Home tab */}
        {activeTab === 'home' && (
          <div className="px-8 pt-6 pb-4 flex items-center justify-between select-none relative z-10">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">مرحباً، <br/>بطلنا الصغير! ✨</h1>
              <p className="text-slate-400 dark:text-slate-400 text-sm font-medium mt-1">جاهز لتعلم الإنجليزية؟</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-orange-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-orange-400 dark:border-orange-500/50">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=spark" alt="Logo" referrerPolicy="no-referrer" className="w-10 h-10" />
              </div>
              <button 
                onClick={toggleTheme}
                className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <div className="text-slate-400"><Sun size={20} /></div>}
              </button>
            </div>
          </div>
        )}

        {/* Content Area based on Tab */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col relative z-10">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <>
              {/* Search Area */}
              <div className="px-6 py-4 space-y-3">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Search />}
                  </motion.button>
                  <div className="bg-slate-50 dark:bg-slate-800 flex-1 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-inner focus-within:border-blue-300 dark:focus-within:border-blue-500 transition-colors">
                    <input 
                      type="text" 
                      value={inputWord}
                      onChange={(e) => setInputWord(e.target.value)}
                      placeholder="اكتب كلمة لترى السحر..." 
                      className="bg-transparent outline-none w-full text-right font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <span className="text-slate-400 dark:text-slate-600 text-xl">⌨️</span>
                  </div>
                </form>

                {/* Topic Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {TOPICS.map((topic) => (
                    <motion.button
                      key={topic.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTopicClick(topic.label)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : topic.color}`}
                    >
                      {topic.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="px-6 space-y-4 pb-10">
                {/* Result Area */}
                {loading && (
                  <div className="bg-white dark:bg-slate-800 border-4 border-blue-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[200px]">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                      <p className="text-slate-400 dark:text-slate-500 font-bold animate-pulse">جاري تحضير السحر...</p>
                  </div>
                )}

                {!loading && result && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 border-4 border-blue-100 dark:border-slate-700 rounded-[2.5rem] p-4 shadow-xl text-center relative"
                  >
                    <button 
                      onClick={() => {
                        setResult(null);
                        setInputWord('');
                        setStory(null);
                      }}
                      className="absolute top-4 left-4 w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 transition-colors z-10"
                    >
                      ✕
                    </button>
                    <div className="w-full h-44 bg-slate-100 dark:bg-slate-900 rounded-[2rem] mb-4 overflow-hidden flex items-center justify-center relative">
                      {result.img ? (
                        <img src={result.img} alt={result.en} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-300 dark:text-slate-700 text-4xl">🖼️</div>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 uppercase italic mb-1">{result.en}</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold mb-3">{result.ar}</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => speak(result.en)}
                        className="bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-blue-100 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Volume2 size={20} />
                        نطق
                      </button>
                      <button 
                        onClick={generateStoryForWord}
                        disabled={storyLoading}
                        className="bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-purple-100 dark:border-slate-600 hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        {storyLoading ? <Loader2 size={20} className="animate-spin" /> : <BookOpen size={20} />}
                        قصة
                      </button>
                    </div>

                    {story && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-purple-50 dark:bg-slate-700/50 rounded-2xl border border-purple-100 dark:border-slate-600 text-right"
                      >
                        <p className="text-slate-700 dark:text-slate-200 font-medium text-sm leading-relaxed mb-2" dir="ltr">{story.en}</p>
                        <p className="text-purple-600 dark:text-purple-400 font-bold text-sm leading-relaxed border-t border-purple-200 dark:border-slate-600 pt-2">{story.ar}</p>
                        <button 
                          onClick={() => speak(story.en)}
                          className="mt-2 text-xs text-purple-500 dark:text-purple-400 font-bold flex items-center gap-1"
                        >
                          <Volume2 size={14} />
                          قراءة القصة
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Dashboard Cards */}
                <div className="space-y-4 pb-6">
                  <SparkCard 
                    title="كلمة اليوم" 
                    subtitle="تعلم مفردة جديدة كل صباح" 
                    icon={<Sun size={32} />} 
                    colorClass="bg-[#2ecc71]" 
                    shadowClass="shadow-emerald-100"
                    onClick={handleDailyWord}
                  />

                  <SparkCard 
                    title="معرض صوري" 
                    subtitle="شاهد إبداعاتك السابقة" 
                    icon={<ImageIcon size={32} />} 
                    colorClass="bg-[#3498db]" 
                    shadowClass="shadow-blue-100"
                    onClick={() => setActiveModal('gallery')}
                  />

                  <SparkCard 
                    title="اختبار سبارك" 
                    subtitle="تحدّ نفسك واجمع النجوم" 
                    icon={<Trophy size={32} />} 
                    colorClass="bg-[#f39c12]" 
                    shadowClass="shadow-orange-100"
                    onClick={startQuiz}
                  />
                </div>
              </div>
            </>
          )}

          {/* LESSONS TAB */}
          {activeTab === 'lessons' && (
            <div className="px-6 py-6 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">رحلة التعلم 🗺️</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm">أكمل المستويات لتصبح بطلاً!</p>
              </div>
              
              <div className="space-y-4">
                {LESSONS.map((lesson) => (
                  <div key={lesson.id} className="relative">
                    <div className={`p-6 rounded-[2rem] text-white shadow-lg relative z-10 overflow-hidden ${lesson.locked ? 'bg-slate-300 dark:bg-slate-700' : lesson.color}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                          {lesson.locked ? <Lock size={24} /> : <BookOpen size={24} />}
                        </div>
                        {lesson.progress === 100 && (
                          <div className="bg-white text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            مكتمل <CheckCircle size={12} />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{lesson.title}</h3>
                      <p className="text-white/80 text-sm mb-4">{lesson.subtitle}</p>
                      
                      {!lesson.locked && (
                        <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full" style={{ width: `${lesson.progress}%` }}></div>
                        </div>
                      )}
                    </div>
                    {/* Connecting Line */}
                    {lesson.id !== LESSONS.length && (
                      <div className="absolute left-1/2 -bottom-6 w-1 h-8 bg-slate-200 dark:bg-slate-700 -z-0 transform -translate-x-1/2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="px-6 py-6">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg">
                  <User size={40} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">البطل الصغير</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm">المستوى 1 • 50 نقطة</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Volume2 size={20} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">الأصوات</span>
                  </div>
                  <div className="w-12 h-6 bg-green-400 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-slate-700 text-purple-600 dark:text-purple-400 rounded-xl">
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">اللغة (Language)</span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-bold">English</span>
                </div>

                <button 
                  onClick={clearGallery}
                  className="w-full bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 text-red-500 dark:text-red-400 font-bold flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 rounded-xl">
                    <Trash2 size={20} />
                  </div>
                  مسح جميع الصور
                </button>

                <div className="mt-8 text-center">
                  <p className="text-slate-300 dark:text-slate-600 text-xs">Mr. Spark v1.0.0</p>
                  <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Made with ❤️ for Kids</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Gallery Modal */}
        <Modal 
          isOpen={activeModal === 'gallery'} 
          onClose={() => setActiveModal(null)} 
          title="معرضي الخاص 🖼️"
        >
          <div className="grid grid-cols-2 gap-4 pb-4">
            {gallery.length === 0 ? (
              <p className="col-span-2 text-center text-slate-400 py-10">لا يوجد صور بعد.. ابدأ بتوليد الكلمات!</p>
            ) : (
              gallery.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  {item.img && <img src={item.img} alt={item.en} referrerPolicy="no-referrer" className="w-full h-24 object-cover rounded-xl mb-2" />}
                  <p className="text-xs font-bold text-center text-blue-600">{item.en}</p>
                  <p className="text-[10px] text-center text-slate-400">{item.ar}</p>
                </div>
              ))
            )}
          </div>
        </Modal>

        {/* Quiz Modal */}
        <Modal 
          isOpen={activeModal === 'quiz'} 
          onClose={() => setActiveModal(null)} 
          title="اختبار الذكاء 🏆"
        >
          <div className="text-center space-y-6 pb-4 overflow-y-auto max-h-[600px] scrollbar-hide">
            {quizLoading ? (
               <div className="py-10 flex flex-col items-center">
                 <Loader2 className="w-10 h-10 text-orange-400 animate-spin mb-4" />
                 <p className="text-slate-400">جاري إعداد الاختبار...</p>
               </div>
            ) : quizData ? (
              <>
                <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100">
                  <p className="text-slate-500 mb-2">ما معنى هذه الكلمة؟</p>
                  <h3 className="text-4xl font-black text-blue-600 uppercase select-none">{quizData.en}</h3>
                  <button 
                    type="button"
                    onClick={() => speak(quizData.en, 'en')}
                    className="mt-3 p-2.5 mx-auto bg-blue-100 dark:bg-slate-700 text-blue-650 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-slate-650 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs"
                  >
                    <Volume2 size={14} />
                    اسمع نطق الكلمة 🇬🇧
                  </button>
                </div>
                <input 
                  type="text" 
                  value={quizInput}
                  onChange={(e) => setQuizInput(e.target.value)}
                  placeholder="اكتب المعنى بالعربي..." 
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 text-center font-bold text-xl outline-none focus:border-orange-400 transition-colors"
                />
                <button 
                  onClick={checkQuiz}
                  className="bg-orange-400 text-white w-full py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-orange-500 transition-colors active:scale-95 animate-pulse"
                >
                  تأكيد الإجابة ✅
                </button>
                {quizFeedback && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2.5 shadow-sm ${
                      quizFeedback.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 text-green-700 dark:text-green-400' 
                        : 'bg-orange-50 dark:bg-orange-950/15 border-orange-200 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    <div className="space-y-1 w-full text-center">
                      <p className="font-tajawal font-black text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {quizFeedback.msg.split('\n')[0]}
                      </p>
                      <p className="font-sans font-bold text-xs text-slate-500 dark:text-slate-400 italic">
                        {quizFeedback.msg.split('\n')[1] || ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          const msg = quizFeedback.msg.split('\n')[0];
                          speak(msg, 'ar');
                        }}
                        className="text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        🔊 نطق بالعربي
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const msg = quizFeedback.msg.split('\n')[1] || '';
                          const englishText = msg.replace(/^[/\s]+/, '');
                          speak(englishText, 'en');
                        }}
                        className="text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        📢 Voice English
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Educational Pedagogical Helper Button & Board */}
                <div className="pt-2">
                  <button 
                    onClick={handleQuizHelp}
                    disabled={quizHelpLoading}
                    type="button"
                    className="w-full bg-purple-100 dark:bg-purple-900/55 text-purple-700 dark:text-purple-300 py-3 rounded-2xl border-2 border-purple-200 dark:border-purple-850 font-bold hover:bg-purple-200 dark:hover:bg-purple-850 transition-colors flex items-center justify-center gap-2"
                  >
                    {quizHelpLoading ? <Loader2 className="animate-spin" size={18} /> : "💡 لا أعرف الكلمة! ساعدني يا سبارك"}
                  </button>
                </div>

                {showQuizHelp && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 p-5 bg-purple-50/70 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/40 rounded-[2rem] text-right space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/30 pb-3">
                      <span className="text-2xl">🎓</span>
                      <div>
                        <h4 className="font-black text-purple-700 dark:text-purple-300 text-right text-sm">مستشار سبارك التعليمي يرحب بك!</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-right mt-0.5">الوقوع في الخطأ خطوة بطل رائع نحو التعلم! 🌟</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/20 text-center shadow-sm">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">الكلمة الصحيحة وحلها:</span>
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase leading-none">{quizData.en}</span>
                        <span className="text-slate-400">◀</span>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{quizData.ar}</span>
                      </div>
                      <button 
                        onClick={() => speak(quizData.en)}
                        className="mt-3 text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 mx-auto bg-blue-50/50 dark:bg-slate-700 px-3 py-1 rounded-full border border-blue-100 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-slate-600 font-bold"
                      >
                        <Volume2 size={12} />
                        استمع للنطق
                      </button>
                    </div>

                    {/* Image Illustration Segment */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">🎨 رسمة الكلمة السحرية:</p>
                      {quizHelpLoading ? (
                        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-dashed border-purple-300">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                          <span className="text-xs text-slate-400">جاري رسم الصورة السحرية... 🖌️</span>
                        </div>
                      ) : quizHelpImage ? (
                        <div className="w-full h-36 bg-slate-200 dark:bg-slate-950 rounded-2xl overflow-hidden border border-purple-100 dark:border-purple-900/30">
                          <img 
                            src={quizHelpImage} 
                            alt={quizData.en} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300">
                          🖼️ لم نستطع رسم صورة حالياً
                        </div>
                      )}
                    </div>

                    {/* Storytelling Segment */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">📖 قصة الكلمة السعيدة:</p>
                      {quizHelpLoading ? (
                        <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center">
                          <span className="text-xs text-slate-400">جاري كتابة قصة ممتعة... ⏳</span>
                        </div>
                      ) : quizHelpStory ? (
                        <div className="p-3 bg-white/80 dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-purple-900/20 space-y-2 text-right shadow-sm">
                          <p className="text-slate-700 dark:text-slate-200 text-xs font-medium leading-relaxed" dir="ltr">{quizHelpStory.en}</p>
                          <p className="text-purple-600 dark:text-purple-400 text-xs font-bold leading-relaxed border-t border-purple-100 dark:border-purple-900/30 pt-1.5">{quizHelpStory.ar}</p>
                          <button 
                            onClick={() => speak(quizHelpStory.en)}
                            className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 bg-purple-50 dark:bg-slate-700 px-2 py-1 rounded-full border border-purple-200 dark:border-slate-650 mr-auto ml-1"
                          >
                            <Volume2 size={10} />
                            استمع للقصة كاملة
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs text-center text-slate-400">
                          فشلت قراءة القصة السحرية
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="py-10 text-red-350">فشل تحميل الاختبار</div>
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}

