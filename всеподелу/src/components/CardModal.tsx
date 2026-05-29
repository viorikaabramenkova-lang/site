import { useState } from "react";
import { X, Check, Calendar, ListTodo, MessageSquare, Trash2, Plus, CornerDownLeft, Move, Clock } from "lucide-react";
import { Priority, Card, User, Tag, Column } from "../types";
import { motion } from "motion/react";
import { db, auth, doc, collection } from "../lib/firebase";
import { useTranslation } from "../lib/i18n";

interface CardModalProps {
  key?: string | number;
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onSave: (card: Card) => void;
  users: User[];
  tags: Tag[];
  columns?: Column[];
}

export default function CardModal({ isOpen, onClose, card, onSave, users, tags, columns = [] }: CardModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [priority, setPriority] = useState<Priority>(card?.priority || Priority.LOW);
  const [assigneeId, setAssigneeId] = useState<string>(card?.assigneeId || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(card?.tagIds || []);
  const [dueDate, setDueDate] = useState<string>(card?.dueDate || "");
  const [dueTime, setDueTime] = useState<string>(card?.dueTime || "");
  const [completed, setCompleted] = useState<boolean>(card?.completed || false);
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>(card?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [comments, setComments] = useState<{ id: string; text: string; authorName: string; createdAt: number; authorPhoto?: string; authorId?: string | null }[]>(card?.comments || []);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<string>(card?.columnId || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) {
      setError(t.cardModal.nameReq);
      return;
    }
    if (!assigneeId) {
      setError(t.cardModal.assigneeReq);
      return;
    }

    const finalCompletedAt = completed 
      ? (card?.completed ? (card.completedAt || Date.now()) : Date.now()) 
      : null;

    onSave({
      id: card?.id || doc(collection(db, "temp")).id,
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeId,
      tagIds: selectedTagIds,
      createdAt: card?.createdAt || Date.now(),
      dueDate,
      dueTime,
      completed,
      completedAt: finalCompletedAt,
      subtasks,
      comments,
      columnId: selectedColumnId || card?.columnId,
    } as Card);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub = {
      id: Math.random().toString(36).slice(2, 9),
      text: newSubtaskText.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskText("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const currentUser = auth.currentUser;
    const authorName = currentUser?.displayName || currentUser?.email?.split("@")[0] || t.cardModal.user;
    const authorPhoto = currentUser?.photoURL || null;
    const newComm = {
      id: Math.random().toString(36).slice(2, 9),
      text: newCommentText.trim(),
      authorName,
      createdAt: Date.now(),
      authorPhoto,
      authorId: currentUser?.uid || null,
    };
    setComments([...comments, newComm]);
    setNewCommentText("");
  };

  const deleteComment = (id: string) => {
    setComments(comments.filter((c) => c.id !== id));
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtasksProgressPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/15 dark:bg-black/45 backdrop-blur-[3px] fixed"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-4xl bg-bg-card border border-border-ui rounded-[2.5rem] shadow-2xl overflow-hidden z-[101] my-auto max-h-[90vh] flex flex-col"
      >
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-border-ui">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/45 text-blue-500 rounded-2xl">
              <Move className="w-5 h-5" />
            </span>
            <h3 className="text-xl md:text-2xl font-black text-text-title">
              {card ? t.cardModal.titleEdit : t.cardModal.titleNew}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-app rounded-2xl text-text-secondary transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Left Column: Details & Checklist & Comments */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary ml-1 uppercase tracking-widest">{t.cardModal.taskNameLabel}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t.cardModal.taskNamePlaceholder}
                className={`w-full p-4 bg-bg-app border-2 rounded-2xl outline-none font-bold text-base md:text-lg transition-all ${
                  error === t.cardModal.nameReq ? "border-red-500 ring-2 ring-red-100" : "border-transparent focus:border-blue-500 focus:bg-transparent"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary ml-1 uppercase tracking-widest">{t.cardModal.descLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.cardModal.descPlaceholder}
                rows={4}
                className="w-full p-4 bg-bg-app border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-transparent transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            {/* Checklist Section */}
            <div className="p-6 bg-transparent border border-white/25 dark:border-white/5 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-sm">{t.cardModal.checklist}</span>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-xs font-bold text-text-secondary bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 rounded-full">
                    {completedSubtasksCount} {t.cardModal.from} {subtasks.length} ({subtasksProgressPercent}%)
                  </span>
                )}
              </div>

              {/* Progress Line */}
              {subtasks.length > 0 && (
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${subtasksProgressPercent}%` }}
                  />
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between group/sub bg-white dark:bg-zinc-800 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 transition-all shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-700/80">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={sub.completed}
                        onChange={() => toggleSubtask(sub.id)}
                        className="w-4 h-4 rounded border-border-ui text-blue-500 focus:ring-blue-500 focus:ring-offset-bg-card cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-all ${sub.completed ? "line-through text-text-secondary" : ""}`}>
                        {sub.text}
                      </span>
                    </label>
                    <button 
                      onClick={() => deleteSubtask(sub.id)}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Row */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  placeholder={t.cardModal.addListItem}
                  className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-blue-500 transition-all text-text-title placeholder:text-text-secondary/50"
                />
                <button 
                  onClick={handleAddSubtask}
                  className="px-3 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.cardModal.addBtn}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-sm">{t.cardModal.discussion} ({comments.length})</span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                {comments.map((comm) => {
                  const commenterProfile = comm.authorId ? users.find(u => u.id === comm.authorId) : null;
                  const displayAuthorName = commenterProfile?.name || comm.authorName;
                  const displayAuthorPhoto = commenterProfile?.photoURL || comm.authorPhoto;
                  return (
                    <div key={comm.id} className="flex gap-3 group/comm pb-3 border-b border-border-ui/50 last:border-0 align-start">
                      <img 
                        src={displayAuthorPhoto || `https://i.pravatar.cc/32?u=${displayAuthorName}`} 
                        className="w-8 h-8 rounded-full border border-border-ui object-cover" 
                        alt="" 
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-title">{displayAuthorName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-secondary">{new Date(comm.createdAt).toLocaleString("ru-RU")}</span>
                            <button 
                              onClick={() => deleteComment(comm.id)}
                              className="opacity-0 group-hover/comm:opacity-100 p-1 text-red-400 hover:text-red-500 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-zinc-700">
                          {comm.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Comment Field */}
              <div className="flex gap-3 items-end">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={t.cardModal.writeComment}
                  rows={2}
                  className="flex-1 p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all resize-none text-text-title placeholder:text-text-secondary/50"
                />
                <button
                  onClick={handleAddComment}
                  className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all hover:scale-105 cursor-pointer"
                  title={t.cardModal.sendComment}
                >
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Metadata & Options */}
          <div className="lg:col-span-2 bg-transparent border border-white/20 dark:border-white/5 p-6 rounded-[2rem] space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">{t.cardModal.cardSettings}</h4>

              {/* Card Readiness/Completion Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5 uppercase tracking-wider">
                  {t.cardModal.taskState}
                </label>
                <button
                  type="button"
                  onClick={() => setCompleted(!completed)}
                  className={`w-full p-3 border rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    completed
                      ? "bg-green-500 border-green-600 text-white shadow-sm"
                      : "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-700/80 hover:text-blue-500 dark:hover:text-blue-400"
                  }`}
                >
                  <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all ${
                    completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-zinc-500"
                  }`}>
                    {completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>{completed ? t.cardModal.taskDone : t.cardModal.markDone}</span>
                </button>
              </div>

              {/* Move to another column */}
              {columns && columns.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" /> {t.cardModal.columnLabel}
                  </label>
                  <select
                    value={selectedColumnId}
                    onChange={(e) => setSelectedColumnId(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 cursor-pointer text-text-title"
                  >
                    <option value="">{t.cardModal.chooseCol}</option>
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignee Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary">{t.cardModal.assigneeLabel}</label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full p-3 bg-white dark:bg-zinc-800 border rounded-xl text-xs font-bold outline-none cursor-pointer text-text-title transition-all ${
                    error === t.cardModal.assigneeReq ? "border-red-500" : "border-slate-200 dark:border-zinc-700 focus:border-blue-500"
                  }`}
                >
                  <option value="">{t.cardModal.chooseAssignee}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary">{t.cardModal.priorityLabel}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(Priority) as Array<keyof typeof Priority>).map((key) => {
                    const value = Priority[key];
                    const active = priority === value;
                    const styles = {
                      [Priority.LOW]: active ? "bg-green-500 border-green-600 text-white" : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-700/80",
                      [Priority.MEDIUM]: active ? "bg-amber-500 border-amber-600 text-white" : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-700/80",
                      [Priority.HIGH]: active ? "bg-red-500 border-red-600 text-white" : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-700/80",
                    };
                    const labels = {
                      [Priority.LOW]: t.cardModal.priorityLow,
                      [Priority.MEDIUM]: t.cardModal.priorityMedium,
                      [Priority.HIGH]: t.cardModal.priorityHigh,
                    };
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPriority(value)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${styles[value]}`}
                      >
                        {labels[value]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date & Time pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {t.cardModal.dueDateLabel}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 cursor-pointer text-text-title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {t.cardModal.dueTimeLabel}
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 cursor-pointer text-text-title"
                  />
                </div>
              </div>

              {/* Tags Selectors */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-secondary">{t.cardModal.tagsLabel}</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                          active
                            ? "border-current shadow-sm font-black"
                            : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-700/80"
                        }`}
                        style={{ color: active ? tag.color : undefined }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error and actions footer */}
            <div className="space-y-4 pt-4 border-t border-border-ui">
              {error && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-bold text-center">
                  {error}
                </motion.p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-xs font-bold text-text-secondary bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all cursor-pointer"
                >
                  {t.cardModal.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {card ? t.cardModal.saveBtn : t.cardModal.createBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
