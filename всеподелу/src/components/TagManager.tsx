import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Tag } from "../types";
import { motion, AnimatePresence } from "motion/react";
import ConfirmModal from "./ConfirmModal";
import { useTranslation } from "../lib/i18n";

import { firestore } from "../lib/db";
import { db, doc, collection } from "../lib/firebase";

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  activeBoardId: string | null;
}

export default function TagManager({ isOpen, onClose, tags, activeBoardId }: TagManagerProps) {
  const { t } = useTranslation();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const addTag = async () => {
    if (!newTagName.trim() || !activeBoardId) return;
    const tagId = Math.random().toString(36).substring(2, 15);
    await firestore.set(`boards/${activeBoardId}/tags`, tagId, {
      id: tagId,
      name: newTagName.trim(),
      color: newTagColor
    });
    setNewTagName("");
  };

  const deleteTag = async (id: string) => {
    if (!activeBoardId) return;
    await firestore.delete(`boards/${activeBoardId}/tags`, id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-colors duration-300 border-l border-slate-200 dark:border-zinc-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-title">{t.tags.title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t.tags.createLabel}</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-white dark:bg-zinc-800/60 border-2 border-slate-250 dark:border-transparent focus-within:border-blue-500 rounded-xl overflow-hidden px-3 transition-all animate-none">
                    <input
                       type="text"
                       value={newTagName}
                       onChange={(e) => setNewTagName(e.target.value)}
                       placeholder={t.tags.tagName}
                       className="w-full h-11 bg-transparent text-sm font-semibold outline-none text-text-title"
                     />
                     <input
                       type="color"
                       value={newTagColor}
                       onChange={(e) => setNewTagColor(e.target.value)}
                       className="w-6 h-6 rounded-full border-none p-0 bg-transparent cursor-pointer"
                     />
                  </div>
                  <button
                    onClick={addTag}
                    className="w-11 h-11 bg-blue-500 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100 dark:shadow-none shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t.tags.activeLabel}</label>
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 hover:border-blue-500/45 dark:hover:border-blue-500/55 transition-all group bg-white dark:bg-zinc-800/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-bold text-text-title">{tag.name}</span>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteId(tag.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-center py-8 text-sm text-text-secondary font-medium">{t.tags.noTags}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50">
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {t.tags.helpText}
              </p>
            </div>
          </motion.div>
          
          {confirmDeleteId && (
            <ConfirmModal
              isOpen={!!confirmDeleteId}
              onClose={() => setConfirmDeleteId(null)}
              onConfirm={() => confirmDeleteId && deleteTag(confirmDeleteId)}
              title={t.tags.deleteHeading}
              message={t.tags.confirmDelete}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
