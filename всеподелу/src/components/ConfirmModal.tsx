import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Удалить",
  cancelText = "Отмена",
  variant = "danger",
}: ConfirmModalProps) {
  const colors = {
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-amber-500 hover:bg-amber-600",
    info: "bg-blue-500 hover:bg-blue-600",
  };

  const iconColors = {
    danger: "text-red-500 bg-red-50",
    warning: "text-amber-500 bg-amber-50",
    info: "text-blue-500 bg-blue-50",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/15 dark:bg-black/45 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className={`p-2 rounded-xl ${iconColors[variant]}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-bg-app rounded-xl text-text-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-text-title mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {message}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border-2 border-border-ui text-text-secondary text-sm font-bold hover:bg-bg-app transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 rounded-2xl text-white text-sm font-bold transition-all shadow-lg ${colors[variant]}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
