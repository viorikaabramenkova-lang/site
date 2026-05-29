import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  Calendar, Check, Clock, MessageSquare, Trash2, ListTodo, AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from "lucide-react";
import { Card, Priority, User, Tag } from "../types";
import { useTranslation } from "../lib/i18n";

interface CardProps {
  key?: string | number;
  card: Card;
  tags?: Tag[];
  users: User[];
  onClick: () => void;
  onDelete: () => void;
  preset?: "modern" | "flat" | "neon";
  onToggleComplete?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  hoverPosition?: "top" | "bottom" | null;
  onMoveCard?: (direction: 'up' | 'down', e: React.MouseEvent) => void;
  isMobile?: boolean;
}

export default function CardComponent({
  card,
  tags = [],
  users,
  onClick,
  onDelete,
  preset = "modern",
  onToggleComplete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  hoverPosition = null,
  onMoveCard,
  isMobile = false,
}: CardProps) {
  const { t, lang } = useTranslation();

  const cardTags = useMemo(() => {
    return tags.filter((t) => card.tagIds?.includes(t.id));
  }, [tags, card.tagIds]);

  const assignee = useMemo(() => {
    return users.find((u) => u.id === card.assigneeId);
  }, [users, card.assigneeId]);

  const totalComments = card.comments?.length || 0;
  const totalSubtasks = card.subtasks?.length || 0;
  const completedSubtasks = card.subtasks?.filter((s) => s.completed).length || 0;

  const isOverdue = useMemo(() => {
    if (!card.dueDate || card.completed) return false;
    let targetTime = new Date(card.dueDate).setHours(23, 59, 59, 999);
    if (card.dueTime) {
      const [hours, minutes] = card.dueTime.split(":").map(Number);
      const targetDate = new Date(card.dueDate);
      targetDate.setHours(hours || 0, minutes || 0, 0, 0);
      targetTime = targetDate.getTime();
    }
    return targetTime < Date.now();
  }, [card.dueDate, card.dueTime, card.completed]);

  const priorityStyles = {
    [Priority.HIGH]: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900",
    [Priority.MEDIUM]: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900",
    [Priority.LOW]: "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900",
  };

  const priorityLabels = {
    [Priority.HIGH]: t.card.priority.high,
    [Priority.MEDIUM]: t.card.priority.medium,
    [Priority.LOW]: t.card.priority.low,
  };

  let presetStyle = "glass-card border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md";
  if (preset === "flat") {
    presetStyle = "bg-slate-100/90 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-800/80 rounded-2xl";
  } else if (preset === "neon") {
    // Elegant neon glowing blue-cyan adaptive card that looks extremely premium in both dark and light modes, and fits background naturally.
    presetStyle = "bg-white/80 border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.08)] hover:border-blue-500 hover:shadow-[0_0_18px_rgba(34,211,238,0.22)] dark:bg-zinc-900/55 dark:backdrop-blur-xl dark:border-cyan-500/30 dark:hover:border-cyan-400 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] dark:hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] rounded-2xl";
  }

  return (
    <motion.div
      layout={isMobile}
      {...(isMobile ? { layoutId: `card-${card.id}` } : {})}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 0.98 : 1,
        y: 0 
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: isDragging ? 0 : -2 }}
      className={`relative group/card-wrapper w-full p-4 cursor-grab active:cursor-grabbing select-none transition-[background,border,box-shadow] duration-300 ${presetStyle} ${
        isDragging ? "shadow-xl ring-2 ring-blue-500/50" : ""
      } ${card.completed ? (preset === "neon" ? "opacity-85 saturate-75" : "opacity-70") : ""}`}
      onClick={onClick}
    >
      {/* Drop Target Indicator - Top */}
      {hoverPosition === "top" && !isDragging && (
        <div className="absolute -top-1.5 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none animate-pulse shadow-[0_0_8px_#3b82f6]" />
      )}

      <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-1.5 text-[8px]">
                {cardTags.map((t) => (
                  <span
                    key={t.id}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      preset === "neon" ? "bg-slate-200/50 dark:bg-black/60 border-cyan-400/20 dark:border-white/10" : "bg-white/50 dark:bg-black/20"
                    }`}
                    style={{ color: t.color, borderColor: `${t.color}25`, borderWidth: "1px" }}
                  >
                    {t.name}
                  </span>
                ))}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  preset === "neon" 
                    ? card.priority === Priority.HIGH 
                      ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 dark:border-red-500/45 font-black shrink-0" 
                      : card.priority === Priority.MEDIUM 
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/40 font-black shrink-0" 
                      : "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-300 border-green-500/20 dark:border-green-500/40 font-black shrink-0"
                    : priorityStyles[card.priority]
                }`}>
                  {priorityLabels[card.priority]}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 mb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete?.();
                }}
                className={`flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  card.completed
                    ? preset === "neon"
                      ? "bg-cyan-500 border-cyan-500 text-white shadow-[0_0_10px_#22d3ee]"
                      : preset === "flat"
                      ? "bg-zinc-800 dark:bg-zinc-200 border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900"
                      : "bg-green-500 border-green-500 text-white"
                    : preset === "neon"
                    ? "border-cyan-400/80 dark:border-cyan-500/70 hover:border-cyan-500 dark:hover:border-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20"
                    : "border-white/40 hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-blue-900/10"
                }`}
                title={card.completed ? t.card.markIncomplete : t.card.markComplete}
              >
                {card.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <h4 className={`text-sm font-bold leading-tight transition-all ${
                card.completed 
                  ? preset === "neon"
                    ? "line-through text-slate-400 dark:text-cyan-200/60 font-semibold dark:drop-shadow-[0_0_4px_rgba(34,211,238,0.25)]"
                    : "line-through text-slate-400 opacity-60 font-medium"
                  : preset === "neon" 
                  ? "text-slate-800 dark:text-white font-extrabold dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                  : "text-text-title"
              } ${
                !card.completed
                  ? preset === "neon"
                    ? "group-hover/card-wrapper:text-blue-500 dark:group-hover/card-wrapper:text-cyan-200 transition-colors duration-300"
                    : preset === "flat"
                    ? "group-hover/card-wrapper:text-slate-800 dark:group-hover/card-wrapper:text-slate-100"
                    : "group-hover/card-wrapper:text-blue-500"
                  : ""
              }`}>
                {card.title}
              </h4>
            </div>
            
            {card.description && (
              <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${
                preset === "neon" ? "text-slate-600 dark:text-slate-100/95 font-medium" : "text-text-secondary"
              }`}>
                {card.description}
              </p>
            )}

            {/* Checklist Quick Stats inside the card */}
            {totalSubtasks > 0 && (
              <div className="mb-4">
                <div className={`flex items-center justify-between text-[10px] font-bold mb-1 ${
                  preset === "neon" ? "text-slate-600 dark:text-slate-200" : "text-text-secondary"
                }`}>
                  <span className="flex items-center gap-1">
                    <ListTodo className={`w-3 h-3 ${
                      preset === "neon" ? "text-blue-500 dark:text-cyan-400 filter dark:drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" : preset === "flat" ? "text-slate-600 dark:text-slate-400" : "text-blue-500"
                    }`} /> {t.card.checklist || "Чек-лист"}
                  </span>
                  <span className={preset === "neon" ? "text-blue-500 dark:text-cyan-300 font-mono font-bold" : ""}>{completedSubtasks}/{totalSubtasks}</span>
                </div>
                <div className={`w-full h-1 rounded-full overflow-hidden ${
                  preset === "neon" ? "bg-zinc-200 dark:bg-zinc-800/80" : "bg-white/30 dark:bg-black/15"
                }`}>
                  <div 
                    className={`${
                      preset === "neon"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        : preset === "flat"
                        ? "bg-zinc-700 dark:bg-zinc-300"
                        : "bg-blue-500"
                    } h-full rounded-full transition-all`}
                    style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between pt-3 border-t ${
              preset === "neon" ? "border-cyan-500/20" : "border-white/10 dark:border-white/5"
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                {card.dueDate ? (
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isOverdue 
                      ? "bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/30" 
                      : preset === "neon"
                      ? "bg-blue-500/10 text-between text-blue-600 dark:bg-cyan-500/15 dark:text-cyan-200 border border-blue-500/20 dark:border-cyan-500/30 font-semibold font-mono"
                      : "bg-white/20 dark:bg-black/10 text-text-secondary"
                  }`} title={isOverdue ? t.card.overdue : t.card.dueDate}>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(card.dueDate).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}{card.dueTime ? ` ${t.card.at || "в"} ${card.dueTime}` : ""}</span>
                  </div>
                ) : (
                  <div className={`flex items-center gap-1 ${preset === "neon" ? "text-slate-500 dark:text-slate-200" : "text-text-secondary"}`}>
                    <Calendar className="w-3.5 h-3.5 opacity-80" />
                    <span className="text-[10px] font-bold">{new Date(card.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}</span>
                  </div>
                )}

                {totalComments > 0 && (
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${preset === "neon" ? "text-blue-500 dark:text-cyan-200" : "text-text-secondary"}`} title={t.card.comments || "Комментарии"}>
                    <MessageSquare className={`w-3.5 h-3.5 ${preset === "neon" ? "text-blue-500 dark:text-cyan-400 filter dark:drop-shadow-[0_0_3px_#22d3ee]" : "text-blue-500/80"}`} />
                    <span>{totalComments}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 lg:hidden bg-black/5 dark:bg-white/5 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => onMoveCard?.('up', e)} 
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-text-secondary cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => onMoveCard?.('down', e)} 
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-text-secondary cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className={`p-1.5 hover:bg-red-500/15 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 rounded-lg transition-all ${
                    preset === "neon" ? "hover:shadow-[0_0_8px_rgba(239,68,68,0.5)] border border-transparent hover:border-red-500/30" : "transition-opacity"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                
                <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shadow-xs ${
                  preset === "neon" ? "ring-2 ring-blue-400 dark:ring-cyan-500/50 bg-zinc-100 dark:bg-zinc-950" : "ring-2 ring-white/50 dark:ring-black/20 bg-white/40"
                }`} title={assignee?.name}>
                  {assignee?.photoURL || card.assigneeId ? (
                    <img src={assignee?.photoURL || `https://i.pravatar.cc/32?u=${card.assigneeId}`} alt={assignee?.name} />
                  ) : (
                    <div className={`text-[8px] font-bold ${preset === "neon" ? "text-blue-500 dark:text-cyan-400" : "text-text-secondary"}`}>?</div>
                  )}
                </div>
              </div>
            </div>

      {/* Drop Target Indicator - Bottom */}
      {hoverPosition === "bottom" && !isDragging && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none animate-pulse shadow-[0_0_8px_#3b82f6]" />
      )}
    </motion.div>
  );
}
