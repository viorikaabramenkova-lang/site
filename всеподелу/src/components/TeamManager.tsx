import React, { useState } from "react";
import { Plus, X, Trash2, UserPlus, Shield } from "lucide-react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import ConfirmModal from "./ConfirmModal";
import { firestore } from "../lib/db";
import { useTranslation } from "../lib/i18n";

interface TeamManagerProps {
  isOpen: boolean;
  onClose: () => void;
  members: User[];
  allUsers: User[];
  activeBoardId: string | null;
  currentUserUid: string;
  isOwner: boolean;
  boardOwnerId: string | null;
}

export default function TeamManager({
  isOpen,
  onClose,
  members,
  allUsers,
  activeBoardId,
  currentUserUid,
  isOwner,
  boardOwnerId,
}: TeamManagerProps) {
  const { t } = useTranslation();
  const [searchEmail, setSearchEmail] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const addMember = async (user: User) => {
    if (!activeBoardId || !isOwner) return;
    await firestore.set(`boards/${activeBoardId}/members`, user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL || "",
    });
  };

  const removeMember = async (memberId: string) => {
    if (!activeBoardId || !isOwner) return;
    try {
      await firestore.delete(`boards/${activeBoardId}/members`, memberId);
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert(t.team.removeError || "Не удалось удалить участника. Проверьте права доступа.");
    }
  };

  const filteredPotentialMembers = allUsers.filter(
    (u) => 
      !members.find((m) => m.id === u.id) && 
      (u.email.toLowerCase().includes(searchEmail.toLowerCase()) || 
       u.name.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end">
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
            className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-colors duration-300 border-l border-slate-200 dark:border-zinc-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-text-title">{t.board.teamManage}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {isOwner && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t.team.inviteToProject}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder={t.team.searchPlaceholder}
                      className="w-full h-11 pl-4 pr-10 bg-white dark:bg-zinc-800 border-2 border-slate-250 dark:border-transparent focus:border-blue-500 rounded-xl text-sm font-semibold outline-none text-text-title transition-all"
                    />
                    <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  </div>
                  
                  {searchEmail && filteredPotentialMembers.length > 0 && (
                    <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredPotentialMembers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            addMember(u);
                            setSearchEmail("");
                          }}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700" src={u.photoURL || `https://i.pravatar.cc/32?u=${u.id}`} alt="" />
                            <div className="text-left">
                              <p className="text-sm font-bold text-text-title">{u.name}</p>
                              <p className="text-[10px] text-text-secondary">{u.email}</p>
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-blue-500 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                  {searchEmail && filteredPotentialMembers.length === 0 && (
                    <div className="text-center py-4 space-y-2 bg-white dark:bg-zinc-800/20 rounded-xl p-4 border border-slate-250/60 dark:border-zinc-800">
                      <p className="text-xs text-text-secondary italic">{t.team.usersNotFound}</p>
                      <p className="text-[10px] text-text-secondary leading-relaxed px-4">
                        {t.team.usersNotFoundDesc}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t.team.projectMembers} ({members.length})</label>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-800/15 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-800" src={member.photoURL || `https://i.pravatar.cc/32?u=${member.id}`} alt="" />
                          {member.id === currentUserUid && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-text-title flex items-center gap-2 truncate">
                            {member.name}
                            {member.id === boardOwnerId && <span key="owner-badge" className="shrink-0 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 px-1.5 py-0.5 rounded-lg uppercase tracking-tighter border border-amber-200 dark:border-amber-900/60 font-bold">{t.team.owner}</span>}
                            {member.id === currentUserUid && <span key="me-badge" className="shrink-0 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 px-1.5 py-0.5 rounded-lg uppercase tracking-tighter">{t.team.you}</span>}
                          </p>
                          <p className="text-[10px] text-text-secondary truncate">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        {isOwner && member.id !== currentUserUid && (
                          <button
                            onClick={() => setConfirmRemoveId(member.id)}
                            className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm border border-red-100 dark:border-red-500/20"
                            title={t.team.removeFromTeam}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {isOwner 
                    ? t.team.ownerHelp
                    : t.team.memberHelp}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      )}
      {confirmRemoveId && (
        <ConfirmModal
          isOpen={!!confirmRemoveId}
          onClose={() => setConfirmRemoveId(null)}
          onConfirm={() => confirmRemoveId && removeMember(confirmRemoveId)}
          title={t.team.removeTitle}
          message={t.team.confirmRemove}
          confirmText={t.board.deleteAction || "Удалить"}
          cancelText={t.board.cancelAction || "Отмена"}
        />
      )}
    </AnimatePresence>
  );
}
