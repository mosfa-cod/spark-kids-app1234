import React from 'react';
import { motion } from 'motion/react';

interface SparkCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  shadowClass: string;
  onClick: () => void;
}

export function SparkCard({ title, subtitle, icon, colorClass, shadowClass, onClick }: SparkCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`spark-card ${colorClass} p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-lg ${shadowClass} cursor-pointer`}
    >
      <div className="text-4xl bg-white/20 p-3 rounded-2xl flex items-center justify-center w-16 h-16">
        {icon}
      </div>
      <div className="text-right flex-1 px-4">
        <h3 className="font-bold text-xl">{title}</h3>
        <p className="opacity-90 text-xs">{subtitle}</p>
      </div>
    </motion.div>
  );
}
