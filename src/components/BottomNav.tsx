import React from 'react';
import { Home, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'lessons' | 'settings';
  onTabChange: (tab: 'home' | 'lessons' | 'settings') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="mt-auto bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-4 pb-8 flex justify-around items-center relative z-10 rounded-b-[2.5rem]">
      <button 
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
      >
        <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
        <span className="text-[10px] font-bold">الإعدادات</span>
      </button>

      <button 
        onClick={() => onTabChange('lessons')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'lessons' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
      >
        <BookOpen size={24} strokeWidth={activeTab === 'lessons' ? 2.5 : 2} />
        <span className="text-[10px] font-bold">الدروس</span>
      </button>

      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
      >
        <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] font-bold">الرئيسية</span>
      </button>
    </div>
  );
}
