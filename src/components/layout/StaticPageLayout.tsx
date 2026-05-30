// components/layout/StaticPageLayout.tsx
"use client";
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';

interface StaticPageLayoutProps {
 title: string;
 subtitle?: string;
 children: React.ReactNode;
}

const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ title, subtitle, children }) => {
 return (
 <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-500/30 overflow-x-hidden">
 <Navbar />
 
 <main className="flex-grow pt-32 pb-24">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Header Section */}
 <div className="mb-16 text-center lg:text-left">
 <motion.h1 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
 >
 {title}
 </motion.h1>
 {subtitle && (
 <motion.p 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-xl text-slate-500 dark:text-slate-400 font-medium"
 >
 {subtitle}
 </motion.p>
 )}
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: 64 }}
 className="h-1.5 bg-indigo-600 rounded-full mt-8 mx-auto lg:ml-0"
 />
 </div>

 {/* Content Section */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.2 }}
 className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-strong:text-slate-900 dark:prose-strong:text-white"
 >
 {children}
 </motion.div>
 </div>
 </main>

 <Footer />
 </div>
 );
};

export default StaticPageLayout;
