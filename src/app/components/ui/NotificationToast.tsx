"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function NotificationToast({ message, type, isVisible, onClose, duration = 4000 }: Props) {
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const config = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/50',
      iconColor: 'text-emerald-500',
      label: 'Úspech'
    },
    error: {
      icon: <AlertCircle size={20} />,
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/50',
      iconColor: 'text-rose-500',
      label: 'Chyba'
    },
    warning: {
      icon: <AlertCircle size={20} />,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/50',
      iconColor: 'text-amber-500',
      label: 'Upozornenie'
    },
    info: {
      icon: <Info size={20} />,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
      iconColor: 'text-blue-500',
      label: 'Info'
    }
  };

  const { icon, bgColor, borderColor, iconColor, label } = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-4 p-4 pr-6 rounded-[1.5rem] border ${bgColor} ${borderColor} backdrop-blur-md shadow-2xl min-w-[320px] max-w-[90vw]`}
        >
          <div className={`${iconColor} p-2 rounded-xl bg-white/10 shadow-inner`}>
            {icon}
          </div>
          
          <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-widest ${iconColor} leading-none mb-1`}>
              {label}
            </p>
            <p className="text-xs font-bold text-[var(--text-main)] leading-tight">
              {message}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors text-[var(--text-muted)] cursor-pointer"
          >
            <X size={16} />
          </button>
          
          <motion.div 
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`absolute bottom-0 left-4 right-4 h-[2px] ${iconColor} opacity-30 origin-left`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}