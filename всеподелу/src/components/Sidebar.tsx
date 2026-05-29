import React from "react";
import { Plus, Trash2, Layout, X, Home, Settings, ChevronRight, BarChart4 } from "lucide-react";
import { Board } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { User as FirebaseUser } from "firebase/auth";

import { auth } from "../lib/firebase";
import { firestore } from "../lib/db";
import ConfirmModal from "./ConfirmModal";
import { useTranslation } from "../lib/i18n";

interface SidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  setActiveBoardId: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onAddBoard: () => void;
  onOpenTeam: () => void;
  onDeleteBoard: (id: string) => void;
  activeTab: "board" | "dashboard" | "templates" | "settings";
  setActiveTab: (tab: "board" | "dashboard" | "templates" | "settings") => void;
}

export default function Sidebar({
  boards,
  activeBoardId,
  setActiveBoardId,
  isOpen,
  onClose,
  currentUser,
  onAddBoard,
  onOpenTeam,
  onDeleteBoard,
  activeTab,
  setActiveTab,
}: SidebarProps) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const { t } = useTranslation();

  const deleteBoard = async (id: string) => {
    try {
      await firestore.delete("boards", id);
      onDeleteBoard(id);
    } catch (err) {
      console.error("Failed to delete board:", err);
      alert("Не удалось удалить доску. Возможно, у вас недостаточно прав.");
    }
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 w-72 glass-panel border-r border-white/20 dark:border-white/5 z-50 lg:z-10 lg:!shadow-none transform transition-all duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 lg:hidden border-b border-white/20 dark:border-white/5">
          <span className="font-bold text-sm uppercase tracking-widest text-text-body">Навигация</span>
          <button onClick={onClose} className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-6">
          <button
            onClick={onOpenTeam}
            className="w-full flex items-center gap-2 px-3 py-2.1 mb-8 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl transition-all group"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-bg-card bg-blue-500/10 flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-2 group-hover:text-blue-500 transition-colors">{t.sidebar.team}</span>
            <Plus className="w-3 h-3 ml-auto text-text-secondary opacity-0 group-hover:opacity-100 transition-all" />
          </button>

          <nav className="p-1 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-[14px] shadow-sm space-y-0.5 relative select-none">
            <SidebarItem icon={<Home className="w-4 h-4" />} label={t.sidebar.board} active={activeTab === "board"} onClick={() => setActiveTab("board")} />
            <SidebarItem icon={<BarChart4 className="w-4 h-4" />} label={t.sidebar.dashboard} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarItem icon={<Layout className="w-4 h-4" />} label={t.sidebar.templates} active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
            <SidebarItem icon={<Settings className="w-4 h-4" />} label={t.sidebar.settings} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-4 mb-4 custom-scrollbar">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t.sidebar.boardsList}</h3>
            <button
              onClick={onAddBoard}
              className="p-1 hover:bg-blue-500/10 text-blue-500 rounded transition-colors"
              title={t.sidebar.newBoard}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-1 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-[14px] shadow-sm space-y-0.5 relative select-none">
            {boards.map((board) => {
              const isActive = activeBoardId === board.id && activeTab === "board";
              return (
                <div
                  key={board.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveBoardId(board.id);
                    setActiveTab("board");
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveBoardId(board.id);
                      setActiveTab("board");
                      onClose();
                    }
                  }}
                  className={`
                    relative w-full flex items-center justify-between px-3 py-2 rounded-lg select-none cursor-pointer outline-none focus:outline-none transition-all duration-300 group active:scale-[0.98]
                    ${isActive ? "" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveBoardBackground"
                      className="absolute inset-0 bg-white dark:bg-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-lg border border-black/[0.02] dark:border-white/5"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 truncate relative z-10">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-blue-500 scale-110 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-400 dark:bg-white/25 group-hover:bg-slate-600 dark:group-hover:bg-white/40"}`} />
                    <span className={`truncate text-[13px] font-medium transition-all duration-300 ${isActive ? "text-blue-500" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200"}`}>{board.name}</span>
                  </div>
                  <div className="flex items-center gap-1 transition-all duration-300 relative z-10">
                    {board.ownerId === currentUser?.uid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(board.id);
                        }}
                        className="p-1 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-md transition-all cursor-pointer"
                        title="Удалить доску"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 transition-all duration-300 ${isActive ? "text-blue-500/80" : "opacity-45 text-slate-500 dark:text-zinc-400"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-white/20 dark:border-white/5">
          <div className="bg-white/30 dark:bg-black/15 rounded-2xl p-4 transition-colors">
            <p className="text-xs font-bold text-text-title mb-1">{t.sidebar.tryPro}</p>
            <p className="text-[10px] text-text-secondary leading-relaxed">{t.sidebar.tryProDesc}</p>
          </div>
        </div>
      </div>

      {confirmDeleteId && (
        <ConfirmModal
          isOpen={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => confirmDeleteId && deleteBoard(confirmDeleteId)}
          title={t.sidebar.confirmBoardDeleteHeading}
          message={t.sidebar.confirmBoardDeleteText}
        />
      )}
    </aside>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium select-none cursor-pointer outline-none focus:outline-none transition-all duration-300 group active:scale-[0.98] ${
        active ? "" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebarActiveBackground"
          className="absolute inset-0 bg-white dark:bg-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-lg border border-black/[0.02] dark:border-white/5"
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 35
          }}
          style={{ zIndex: 0 }}
        />
      )}
      <span className={`relative z-10 transition-all duration-300 ${active ? "text-blue-500 scale-110 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200"}`}>
        {icon}
      </span>
      <span className={`relative z-10 transition-all duration-300 ${active ? "text-blue-500" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200"}`}>
        {label}
      </span>
    </button>
  );
}
