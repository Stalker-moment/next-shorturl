"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Option {
 value: string;
 label: string;
}

interface CustomDropdownProps {
 options: Option[];
 value: string;
 onChange: (value: string) => void;
 disabled?: boolean;
 className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
 options,
 value,
 onChange,
 disabled = false,
 className = ""
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const selectedOption = options.find(o => o.value === value);
 const dropdownRef = useRef<HTMLDivElement>(null);
 const [isMobile, setIsMobile] = useState(false);

 // Detect screen size for responsive animations
 useEffect(() => {
 const checkMobile = () => {
 setIsMobile(window.innerWidth < 768);
 };
 checkMobile();
 window.addEventListener('resize', checkMobile);
 return () => window.removeEventListener('resize', checkMobile);
 }, []);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleSelect = (val: string) => {
 onChange(val);
 setIsOpen(false);
 };

 // Animation variants
 const dropdownVariants = {
 hidden: isMobile 
 ? { y: "100%", opacity: 0 } 
 : { opacity: 0, y: -10, scale: 0.95 },
 visible: isMobile 
 ? { y: 0, opacity: 1 } 
 : { opacity: 1, y: 0, scale: 1 },
 exit: isMobile 
 ? { y: "100%", opacity: 0 } 
 : { opacity: 0, y: -10, scale: 0.95 }
 };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 h-12 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-slate-700 dark:text-slate-200 transition-all ${
          disabled 
            ? 'opacity-60 cursor-not-allowed' 
            : 'cursor-pointer hover:border-slate-350 dark:hover:border-slate-700/80 hover:bg-slate-100/30 dark:hover:bg-slate-800/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 shadow-sm'
        }`}
        disabled={disabled}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}

        {isOpen && (
          <motion.div
            key="menu"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              ${isMobile 
                ? 'fixed bottom-0 left-0 right-0 rounded-t-[2rem] z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl' 
                : 'absolute top-full left-0 mt-2 rounded-2xl z-[100] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none min-w-[180px] w-full'
              }
              overflow-hidden
            `}
          >
            {/* Mobile Header Handle */}
            {isMobile && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full mt-3" />
                <div className="w-full flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Pilih Opsi</span>
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <ul className={`p-2 ${isMobile ? 'max-h-[50vh] overflow-y-auto pb-8' : 'max-h-60 overflow-y-auto'} custom-scrollbar`}>
              {options.map(option => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-left transition-all duration-150
                      hover:bg-violet-50/50 dark:hover:bg-slate-800/60
                      ${option.value === value 
                        ? 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 font-extrabold' 
                        : 'text-slate-600 dark:text-slate-300'
                      }
                    `}
                  >
                    <span className="text-sm md:text-xs">{option.label}</span>
                    {option.value === value && (
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
 );
};
