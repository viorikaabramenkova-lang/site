import React from "react";
import { signInWithGoogle } from "../lib/firebase";
import { motion } from "motion/react";
import { useTranslation } from "../lib/i18n";

export default function Auth() {
  const { t, lang } = useTranslation();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert((t as any).auth?.failed || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="max-w-md w-full bg-bg-card rounded-[2.5rem] shadow-xl shadow-blue-100 dark:shadow-none p-10 text-center border border-border-ui"
      >
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-lg shadow-blue-200 dark:shadow-none">
          {lang === "en" ? "A" : "В"}
        </div>
        <h1 className="text-3xl font-bold text-text-title mb-4 tracking-tight">
          {lang === "en" ? "All To The Point" : "ВсеПоДелу"}
        </h1>
        <p className="text-text-secondary mb-10 leading-relaxed">
          {(t as any).auth?.subtitle || "Professional task manager for high-performing teams. Manage projects faster with Kanban boards."}
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-bg-card border-2 border-border-ui hover:border-blue-500 hover:bg-bg-app rounded-2xl flex items-center justify-center gap-3 text-text-title font-bold transition-all group scale-100 active:scale-95 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          {(t as any).auth?.googleBtn || "Continue with Google"}
        </button>
        
        <p className="mt-8 text-[11px] text-text-secondary uppercase tracking-widest font-bold">
          {(t as any).auth?.footer || "Secure cloud data storage"}
        </p>
      </motion.div>
    </div>
  );
}
