import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  BarChart4, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Percent, 
  Trash2, 
  Inbox, 
  Flame, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ExternalLink,
  Tag as TagIcon,
  Archive,
  BookOpen,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Board, Column, Card, Tag, User as ProjectUser, Priority } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../lib/i18n";

interface DashboardProps {
  board: Board;
  columns: Column[];
  cards: Card[];
  allTrashedCards?: Card[];
  tags: Tag[];
  users: ProjectUser[];
  onOpenCard?: (colId: string, card: Card) => void;
  onUpdateCardLine?: (updatedCard: Card) => Promise<void>;
  boards?: Board[];
  onBoardChange?: (boardId: string) => void;
}

type Period = "Day" | "Week" | "Month" | "Year";

export default function Dashboard({
  board,
  columns,
  cards: rawCards,
  allTrashedCards,
  tags,
  users,
  onOpenCard,
  onUpdateCardLine,
  boards = [],
  onBoardChange
}: DashboardProps) {
  const cards = useMemo(() => rawCards.filter((c) => !c.isTrashed), [rawCards]);
  const trashedCards = useMemo(() => {
    if (allTrashedCards) return allTrashedCards;
    return rawCards.filter((c) => c.isTrashed);
  }, [allTrashedCards, rawCards]);

  const [period, setPeriod] = useState<Period>("Month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [hoveredStatusIdx, setHoveredStatusIdx] = useState<number | null>(null);
  const [hoveredPriorityIdx, setHoveredPriorityIdx] = useState<number | null>(null);
  const [hoveredActivityIdx, setHoveredActivityIdx] = useState<number | null>(null);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState<"dueToday" | "urgent" | "overdue">("dueToday");
  const { t, lang } = useTranslation();

  const handlePrev = () => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (period === "Day") d.setDate(d.getDate() - 1);
      else if (period === "Week") d.setDate(d.getDate() - 7);
      else if (period === "Month") d.setMonth(d.getMonth() - 1);
      else if (period === "Year") d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (period === "Day") d.setDate(d.getDate() + 1);
      else if (period === "Week") d.setDate(d.getDate() + 7);
      else if (period === "Month") d.setMonth(d.getMonth() + 1);
      else if (period === "Year") d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const handleReset = () => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setCurrentDate(new Date());
  };

  const [zoomScale, setZoomScale] = useState(1);
  const zoomOrigin = { x: 50, y: 50 };
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // States for pinch-to-zoom support
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);
  const [pinchStartScale, setPinchStartScale] = useState<number>(1);

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStartX(clientX);
    setDragStartY(clientY);
    setIsSwiping(true);
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (dragStartX === null) return;
    const diffX = clientX - dragStartX;
    if (zoomScale > 1) {
      const diffY = dragStartY !== null ? clientY - dragStartY : 0;
      setZoomPan(prev => {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        const containerWidth = rect ? rect.width : 340;
        const containerHeight = rect ? rect.height : 176;
        
        // Exact pixel limit bounds in scaled coordinates
        const maxShiftX = (containerWidth * (zoomScale - 1)) / (2 * zoomScale);
        const maxShiftY = (containerHeight * (zoomScale - 1)) / (2 * zoomScale);
        
        // 1:1 desktop/mobile drag stickiness
        const adjDiffX = diffX / zoomScale;
        const adjDiffY = diffY / zoomScale;

        return {
          x: Math.max(-maxShiftX, Math.min(maxShiftX, prev.x + adjDiffX)),
          y: Math.max(-maxShiftY, Math.min(maxShiftY, prev.y + adjDiffY))
        };
      });
      setDragStartX(clientX);
      setDragStartY(clientY);
    } else {
      setDragOffset(diffX);
    }
  };

  const handleDragEnd = () => {
    if (dragStartX === null) return;
    if (zoomScale > 1) {
      // boundaries are constrained
    } else {
      const threshold = 50;
      if (dragOffset > threshold) {
        handlePrev();
      } else if (dragOffset < -threshold) {
        handleNext();
      }
    }
    setDragStartX(null);
    setDragStartY(null);
    setDragOffset(0);
    setIsSwiping(false);
  };

  const getTouchDist = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      setPinchStartDist(dist);
      setPinchStartScale(zoomScale);
    } else if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist !== null) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const factor = dist / pinchStartDist;
      const nextScale = Math.max(1, Math.min(4, pinchStartScale * factor));
      setZoomScale(nextScale);
      if (nextScale === 1) {
        setZoomPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && pinchStartDist === null) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setPinchStartDist(null);
    handleDragEnd();
  };

  const handleDoubleClick = (clientX: number, clientY: number) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (zoomScale > 1) {
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
      setZoomPan({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      setZoomScale(prev => {
        const zoomFactor = 0.25;
        const next = Math.max(1, Math.min(4, prev + (e.deltaY < 0 ? zoomFactor : -zoomFactor)));
        if (next === 1) {
          setZoomPan({ x: 0, y: 0 });
        }
        return next;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const isTodayInPeriod = useMemo(() => {
    const today = new Date();
    const tY = today.getFullYear();
    const tM = today.getMonth();
    const tD = today.getDate();

    const cY = currentDate.getFullYear();
    const cM = currentDate.getMonth();
    const cD = currentDate.getDate();

    if (period === "Day") {
      return tY === cY && tM === cM && tD === cD;
    }
    if (period === "Week") {
      const getMondayTime = (d: Date) => {
        const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayOfW = mon.getDay();
        const diff = dayOfW === 0 ? 6 : dayOfW - 1;
        mon.setDate(mon.getDate() - diff);
        mon.setHours(0,0,0,0);
        return mon.getTime();
      };
      return getMondayTime(today) === getMondayTime(currentDate);
    }
    if (period === "Month") {
      return tY === cY && tM === cM;
    }
    if (period === "Year") {
      return tY === cY;
    }
    return false;
  }, [currentDate, period]);

  const currentPeriodLabel = useMemo(() => {
    if (period === "Day") {
      return currentDate.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    if (period === "Week") {
      const currentDayOfW = currentDate.getDay();
      const diffToMonday = currentDayOfW === 0 ? 6 : currentDayOfW - 1;
      const monday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      monday.setDate(currentDate.getDate() - diffToMonday);
      
      const sunday = new Date(monday.getTime());
      sunday.setDate(monday.getDate() + 6);

      const optShort: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
      const optLong: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

      const mStr = monday.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", optShort);
      const sStr = sunday.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", optLong);
      return `${mStr} — ${sStr}`;
    }
    if (period === "Month") {
      return currentDate.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
        month: "long",
        year: "numeric"
      });
    }
    if (period === "Year") {
      return lang === "ru"
        ? `${currentDate.getFullYear()} год`
        : `${currentDate.getFullYear()}`;
    }
    return "";
  }, [currentDate, period, lang]);

  // Today's date components
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Helper check for Done columns
  const isDoneColumn = (colId?: string) => {
    if (!colId) return false;
    const col = columns.find(c => c.id === colId);
    if (!col) return false;
    const lowerName = col.name.toLowerCase();
    return lowerName.includes("готово") || lowerName.includes("done") || lowerName.includes("завершено") || lowerName.includes("выполнено");
  };

  const isCardCompleted = (c: Card) => {
    return c.completed === true || isDoneColumn(c.columnId);
  };

  // Metrics
  const totalTasks = cards.length;
  const completedTasks = cards.filter(c => isCardCompleted(c)).length;
  const pendingTasks = totalTasks - completedTasks;

  // Overdue
  const overdueTasksList = useMemo(() => {
    return cards.filter(c => {
      if (!c.dueDate || isCardCompleted(c)) return false;
      let targetTime = new Date(c.dueDate).setHours(23, 59, 59, 999);
      if (c.dueTime) {
        const [hours, minutes] = c.dueTime.split(":").map(Number);
        const targetDate = new Date(c.dueDate);
        targetDate.setHours(hours || 0, minutes || 0, 0, 0);
        targetTime = targetDate.getTime();
      }
      return targetTime < Date.now();
    });
  }, [cards, columns]);
  const overdueTasksCount = overdueTasksList.length;

  // Permanent Delete estimate
  const trashCount = trashedCards.length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Due Today tasks list
  const dueTodayList = useMemo(() => {
    return cards.filter(c => c.dueDate === todayStr && !isCardCompleted(c));
  }, [cards, todayStr, columns]);
  const dueTodayCount = dueTodayList.length;

  // Completed Today
  const completedTodayList = useMemo(() => {
    return cards.filter(c => {
      if (!isCardCompleted(c)) return false;
      if (c.completedAt) {
        const compDate = new Date(c.completedAt).toISOString().split("T")[0];
        return compDate === todayStr;
      }
      const formattedCreated = new Date(c.createdAt).toISOString().split("T")[0];
      return formattedCreated === todayStr;
    });
  }, [cards, todayStr, columns]);
  const completedTodayCount = completedTodayList.length;

  // High Priority
  const highPriorityList = useMemo(() => {
    return cards.filter(c => c.priority === Priority.HIGH && !isCardCompleted(c));
  }, [cards, columns]);
  const highPriorityCount = highPriorityList.length;

  // Status Distribution for Donut Chart
  const statusDistribution = useMemo(() => {
    return columns.filter(c => !c.isTrashed).map(col => {
      const count = cards.filter(c => c.columnId === col.id).length;
      const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
      return {
        name: col.name,
        count,
        percentage
      };
    });
  }, [columns, cards, totalTasks]);

  // Priority distribution statistics for Bar Chart
  const priorityDistribution = useMemo(() => {
    const counts = {
      [Priority.HIGH]: cards.filter(c => c.priority === Priority.HIGH).length,
      [Priority.MEDIUM]: cards.filter(c => c.priority === Priority.MEDIUM).length,
      [Priority.LOW]: cards.filter(c => c.priority === Priority.LOW).length,
    };
    return [
      { key: Priority.HIGH, label: t.dashboard.priorityHigh, count: counts[Priority.HIGH], color: "#ef4444" },
      { key: Priority.MEDIUM, label: t.dashboard.priorityMedium, count: counts[Priority.MEDIUM], color: "#f59e0b" },
      { key: Priority.LOW, label: t.dashboard.priorityLow, count: counts[Priority.LOW], color: "#10b981" },
    ];
  }, [cards, t]);

  // View period tasks activity distribution matching selectors
  const activityData = useMemo(() => {
    const todayYear = currentDate.getFullYear();
    const todayMonth = currentDate.getMonth();
    const todayDay = currentDate.getDate();

    const getCompletionTime = (c: Card) => {
      if (c.completedAt) return c.completedAt;
      if (isCardCompleted(c)) return c.createdAt; // fallback to created timestamp
      return null;
    };

    switch (period) {
      case "Day": {
        let created_00 = 0, created_04 = 0, created_08 = 0, created_12 = 0, created_16 = 0, created_20 = 0;
        let done_00 = 0, done_04 = 0, done_08 = 0, done_12 = 0, done_16 = 0, done_20 = 0;

        const startOfDay = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0).getTime();
        const endOfDay = new Date(todayYear, todayMonth, todayDay, 23, 59, 59, 999).getTime();

        cards.forEach((c) => {
          if (c.createdAt >= startOfDay && c.createdAt <= endOfDay) {
            const createdHour = new Date(c.createdAt).getHours();
            if (createdHour <= 4) created_00++;
            else if (createdHour <= 8) created_08++;
            else if (createdHour <= 12) created_12++;
            else if (createdHour <= 16) created_16++;
            else if (createdHour <= 20) created_20++;
            else created_20++; // map all later hours
          }

          if (isCardCompleted(c)) {
            const compTime = getCompletionTime(c);
            if (compTime && compTime >= startOfDay && compTime <= endOfDay) {
              const doneHour = new Date(compTime).getHours();
              if (doneHour <= 4) done_00++;
              else if (doneHour <= 8) done_08++;
              else if (doneHour <= 12) done_12++;
              else if (doneHour <= 16) done_16++;
              else if (doneHour <= 20) done_20++;
              else done_20++;
            }
          }
        });

        return [
          { label: "00:00", created: created_00, done: done_00 },
          { label: "04:00", created: created_04, done: done_04 },
          { label: "08:00", created: created_08, done: done_08 },
          { label: "12:00", created: created_12, done: done_12 },
          { label: "16:00", created: created_16, done: done_16 },
          { label: "20:00", created: created_20, done: done_20 },
        ];
      }
      case "Week": {
        const currentDayOfW = currentDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
        const diffToMonday = currentDayOfW === 0 ? 6 : currentDayOfW - 1;
        
        const monday = new Date(todayYear, todayMonth, todayDay);
        monday.setDate(todayDay - diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const days = lang === "ru"
          ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        
        return days.map((label, idx) => {
          const dayStart = new Date(monday.getTime());
          dayStart.setDate(monday.getDate() + idx);
          dayStart.setHours(0, 0, 0, 0);
          const dayStartMs = dayStart.getTime();

          const dayEnd = new Date(dayStart.getTime());
          dayEnd.setHours(23, 59, 59, 999);
          const dayEndMs = dayEnd.getTime();

          let created = 0;
          let done = 0;

          cards.forEach((c) => {
            if (c.createdAt >= dayStartMs && c.createdAt <= dayEndMs) {
              created++;
            }
            if (isCardCompleted(c)) {
              const compTime = getCompletionTime(c);
              if (compTime && compTime >= dayStartMs && compTime <= dayEndMs) {
                done++;
              }
            }
          });

          return { label, created, done };
        });
      }
      case "Year": {
        const months = lang === "ru"
          ? ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return months.map((label, idx) => {
          const monthStartMs = new Date(todayYear, idx, 1, 0, 0, 0, 0).getTime();
          const monthEndMs = new Date(todayYear, idx + 1, 0, 23, 59, 59, 999).getTime();

          let created = 0;
          let done = 0;

          cards.forEach((c) => {
            if (c.createdAt >= monthStartMs && c.createdAt <= monthEndMs) {
              created++;
            }
            if (isCardCompleted(c)) {
              const compTime = getCompletionTime(c);
              if (compTime && compTime >= monthStartMs && compTime <= monthEndMs) {
                done++;
              }
            }
          });

          return { label, created, done };
        });
      }
      case "Month":
      default: {
        const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayStartMs = new Date(todayYear, todayMonth, day, 0, 0, 0, 0).getTime();
          const dayEndMs = new Date(todayYear, todayMonth, day, 23, 59, 59, 999).getTime();

          let created = 0;
          let done = 0;

          cards.forEach((c) => {
            if (c.createdAt >= dayStartMs && c.createdAt <= dayEndMs) {
              created++;
            }
            if (isCardCompleted(c)) {
              const compTime = getCompletionTime(c);
              if (compTime && compTime >= dayStartMs && compTime <= dayEndMs) {
                done++;
              }
            }
          });

          return {
            label: String(day),
            created,
            done
          };
        });
      }
    }
  }, [period, currentDate, cards, columns, lang]);

  const openCardDetails = (card: Card) => {
    if (onOpenCard) {
      onOpenCard(card.columnId || columns[0]?.id || "", card);
    }
  };

  const handleToggleDone = async (card: Card) => {
    if (!onUpdateCardLine) return;
    const isNowCompleted = card.completed === true;
    const targetCompleted = !isNowCompleted;
    await onUpdateCardLine({ 
      ...card, 
      completed: targetCompleted,
      completedAt: targetCompleted ? Date.now() : null
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-y-auto px-6 pt-6 pb-52 space-y-8 custom-scrollbar">
      
      {/* Redesigned Premium Header Panel with Glassy feel */}
      <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 rounded-full">
              <BarChart4 className="w-3 h-3" />
              {t.dashboard.metrics}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h2 className="text-xl md:text-2xl font-black text-text-title tracking-tight">{board.name}</h2>
              <span className="text-slate-300 dark:text-slate-700 font-extralight text-xl">/</span>
              <span className="text-text-secondary text-sm font-semibold">{t.dashboard.titleSuffix.replace(" — ", "")}</span>
            </div>
          </div>
          
          {/* Beautiful Inline Board Switcher looking like a premium breadcrumb dropdown */}
          {boards.length > 0 && (
            <div className="relative inline-flex items-center self-start sm:self-auto sm:mt-4">
              <select
                value={board.id}
                onChange={(e) => onBoardChange?.(e.target.value)}
                className="h-9 pl-4 pr-10 bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 border border-slate-200/30 dark:border-white/5 rounded-full text-[11px] font-black text-text-title tracking-wide outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none min-w-[180px] shadow-sm"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id} className="font-semibold bg-white dark:bg-zinc-900 text-text-title">
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Elegant Period Selection Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-zinc-900/80 p-1 border border-slate-200/50 dark:border-white/5 rounded-2xl self-start md:self-auto shadow-inner">
          {(["Day", "Week", "Month", "Year"] as Period[]).map((p) => {
            const labelsMap = { 
              Day: t.dashboard.periodDay, 
              Week: t.dashboard.periodWeek, 
              Month: t.dashboard.periodMonth, 
              Year: t.dashboard.periodYear 
            };
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setCurrentDate(new Date());
                }}
                className={`px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${
                  period === p 
                    ? "bg-blue-500 text-white shadow-md scale-[1.03]" 
                    : "text-text-secondary hover:text-text-title hover:bg-white/50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {labelsMap[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern High-Fidelity Bento Grid Layout (Total 12 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        
        {/* Core Analytics Hero Matrix Panel (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#007aff] via-[#006ee6] to-[#0055d2] text-white rounded-[28px] p-6 relative overflow-hidden shadow-lg border border-blue-500/20 group hover:shadow-blue-500/10 transition-all duration-300">
          <div className="absolute right-0 bottom-0 p-4 opacity-[0.05] group-hover:scale-105 transition-transform duration-500">
            <Percent className="w-36 h-36 stroke-[1.5]" />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-blue-100 tracking-widest uppercase">{t.dashboard.completionRate}</p>
            <span className="text-[10px] bg-white/10 text-white font-extrabold px-3 py-1 rounded-full backdrop-blur-xs">
              {t.dashboard.activeLabel}
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tight">{completionRate}%</span>
            <span className="text-xs text-blue-200 font-medium">{t.dashboard.avgSpeed}</span>
          </div>

          {/* Saas Telemetry progress track */}
          <div className="w-full bg-white/15 h-2.5 rounded-full mt-5 overflow-hidden border border-white/5">
            <div 
              className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
              style={{ width: `${completionRate}%` }} 
            />
          </div>

          {/* Unified horizontal Pill counters */}
          <div className="grid grid-cols-3 gap-2.5 mt-6">
            <div className="bg-white/15 dark:bg-black/15 border border-white/5 rounded-2xl p-3 text-center backdrop-blur-xs">
              <span className="block text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">{t.dashboard.totalTasksLabel}</span>
              <span className="text-lg font-black">{totalTasks}</span>
            </div>
            <div className="bg-white/15 dark:bg-black/15 border border-white/5 rounded-2xl p-3 text-center backdrop-blur-xs">
              <span className="block text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">{t.dashboard.completedLabel}</span>
              <span className="text-lg font-black">{completedTasks}</span>
            </div>
            <div className="bg-white/15 dark:bg-black/15 border border-white/5 rounded-2xl p-3 text-center backdrop-blur-xs">
              <span className="block text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">{t.dashboard.inProgressLabel}</span>
              <span className="text-lg font-black">{pendingTasks}</span>
            </div>
          </div>
        </div>

        {/* Today's Objectives focus tracker (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/65">
            <div>
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">{t.dashboard.todayTotal}</p>
              <h3 className="text-xs font-bold text-text-title mt-0.5">{t.dashboard.todayDesc}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-3xl font-black text-text-title">{dueTodayCount}</span>
              <div className="text-[10px] text-text-secondary font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                {t.dashboard.todayTotal}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-1 text-right">
              <span className="text-3xl font-black text-green-500">{completedTodayCount}</span>
              <div className="text-[10px] text-text-secondary font-bold flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 block" />
                {t.dashboard.doneTodayLabel}
              </div>
            </div>
          </div>

          {/* Progress loop inside */}
          <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-2xl flex items-center justify-between gap-2">
            <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">{t.dashboard.completionToday || "Выполнение сегодня"}</div>
            <div className="font-mono text-[10px] font-extrabold text-blue-500">
              {dueTodayCount + completedTodayCount > 0 
                ? Math.round((completedTodayCount / (dueTodayCount + completedTodayCount)) * 100) 
                : 100}%
            </div>
          </div>
        </div>

        {/* Critical Actions Radar (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">{t.dashboard.criticalLabel}</p>
            <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary">{t.dashboard.overdueLabel}</span>
              <span className={`text-xl font-mono font-black ${overdueTasksCount > 0 ? "text-red-500" : "text-text-title"}`}>
                {overdueTasksCount}
              </span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-zinc-800" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary">{t.dashboard.urgentTitle}</span>
              <span className={`text-xl font-mono font-black ${highPriorityCount > 0 ? "text-amber-500" : "text-text-title"}`}>
                {highPriorityCount}
              </span>
            </div>
          </div>

          <div className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-md text-center tracking-wider ${
            overdueTasksCount > 0 
              ? "bg-red-500/10 text-red-500 animate-pulse" 
              : "bg-slate-100 dark:bg-zinc-800 text-text-secondary"
          }`}>
            {overdueTasksCount > 0 ? t.dashboard.urgentBadge : t.dashboard.noneBadge}
          </div>
        </div>

        {/* Systems Archive Purge controller (lg:col-span-2) */}
        <div 
          onClick={() => setIsTrashModalOpen(true)}
          className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer active:scale-98 select-none border-dashed"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">{t.dashboard.openTrashLabel}</p>
            <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-text-secondary rounded-xl group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-[10px] text-text-secondary font-bold">{t.dashboard.deletedLabel}</div>
            <div className="text-3xl font-mono font-black text-text-title mt-0.5">{trashCount}</div>
          </div>

          <button 
            type="button" 
            className="w-full py-2 bg-slate-100 hover:bg-red-500/10 dark:bg-zinc-800 hover:text-red-500 dark:hover:bg-red-500/15 text-text-secondary text-[10px] font-black rounded-xl transition-all tracking-wider uppercase cursor-pointer"
          >
            {t.dashboard.openTrashBtn}
          </button>
        </div>

      </div>

      {/* Structured Modern Visualization Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart 1: Dynamics (Spline Chart Card) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-text-title tracking-tight">{t.dashboard.dynamics}</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">{t.dashboard.ratio} ({period})</p>
            </div>
            <div className="p-2 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl text-blue-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {/* Interactive Date Horizon Controller (Ultra-Clean, Gesture-Optimized) */}
          <div className="flex flex-col items-center justify-center mt-4 px-2 py-2 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <div className="flex flex-col items-center select-none text-center w-full">
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500/80 dark:text-blue-400 mb-0.5 text-center px-1 flex flex-col items-center gap-1 leading-normal w-full">
                <span className="animate-pulse">
                  {lang === "ru" 
                    ? "← Свайп для дат / Колесо мыши & дабл-клик для масштаба →" 
                    : "← Swipe for dates / Mouse wheel & double-click to scale →"}
                </span>
                {zoomScale > 1 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setZoomPan({ x: 0, y: 0 });
                    }}
                    className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[8px] font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    {lang === "ru" ? "Сбросить масштаб [×]" : "Reset zoom [×]"}
                  </button>
                )}
              </span>
              <span className="text-[11px] font-black text-text-title tracking-tight text-center">
                {currentPeriodLabel}
              </span>
              {!isTodayInPeriod && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-600 tracking-wider h-3 cursor-pointer mt-1 z-10"
                >
                  {lang === "ru" ? "Вернуться к сегодня" : "Reset to today"}
                </button>
              )}
            </div>
          </div>

          {/* SVG Sparkline / Spline Line Chart (High Fidelity with Sleek Drag Swipe & Zero Scrollbars) */}
          {(() => {
            const count = activityData.length;
            const paddingLeft = 35;
            const paddingRight = 35;
            // Fits 100% of container width so no visual scroll bars are needed
            const graphWidth = 330;
            const viewBoxWidth = graphWidth + paddingLeft + paddingRight;
            const stepX = graphWidth / Math.max(1, count - 1);
            const maxVal = Math.max(...activityData.map(d => Math.max(d.created, d.done, 4)));

            const radius = period === "Month" ? 2.5 : 4.5;
            const hoverRadius = period === "Month" ? 4.5 : 8;

            const getPoints = (key: "created" | "done") => {
              return activityData.map((d, i) => {
                const x = paddingLeft + i * stepX;
                const y = 170 - (d[key] / maxVal) * 140;
                return { x, y, value: d[key] };
              });
            };

            const createdPoints = getPoints("created");
            const donePoints = getPoints("done");

            const buildSmoothPath = (pts: { x: number, y: number }[]) => {
              if (pts.length === 0) return "";
              let path = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const cpX1 = pts[i].x + stepX / 2;
                const cpY1 = pts[i].y;
                const cpX2 = pts[i + 1].x - stepX / 2;
                const cpY2 = pts[i + 1].y;
                path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pts[i + 1].x} ${pts[i + 1].y}`;
              }
              return path;
            };

            const buildSmoothAreaPath = (pts: { x: number, y: number }[]) => {
              if (pts.length === 0) return "";
              const first = pts[0];
              const last = pts[pts.length - 1];
              return `${buildSmoothPath(pts)} L ${last.x} 170 L ${first.x} 170 Z`;
            };

            return (
              <div 
                ref={chartContainerRef}
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={(e) => handleDoubleClick(e.clientX, e.clientY)}
                className="h-44 relative w-full pt-4 select-none cursor-grab active:cursor-grabbing overflow-hidden touch-pan-y"
                style={{
                  transform: zoomScale === 1 ? `translateX(${dragOffset * 0.35}px)` : 'none',
                  opacity: isSwiping && zoomScale === 1 ? Math.max(0.6, 1 - Math.abs(dragOffset) / 300) : 1,
                  transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease"
                }}
              >
                {/* Floating zoom keys control panel for accessible, premium interaction */}
                <div className="absolute right-2 top-2 flex flex-col gap-1 z-30 opacity-70 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(prev => Math.min(4, prev + 0.5));
                    }}
                    className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-md shadow-xs border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer"
                    title={lang === "ru" ? "Приблизить" : "Zoom In"}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(prev => {
                        const next = Math.max(1, prev - 0.5);
                        if (next === 1) {
                          setZoomPan({ x: 0, y: 0 });
                        }
                        return next;
                      });
                    }}
                    className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-md shadow-xs border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer"
                    title={lang === "ru" ? "Отдалить" : "Zoom Out"}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-full h-full">
                  <svg viewBox={`0 0 ${viewBoxWidth} 200`} className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="createdGradientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="doneGradientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <g 
                      style={{
                        transform: `scale(${zoomScale}) translate(${zoomPan.x}px, ${zoomPan.y}px)`,
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                        transition: isSwiping ? "none" : "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                    >
                      <line x1={paddingLeft} y1="20" x2={paddingLeft + graphWidth} y2="20" stroke="currentColor" className="text-slate-150 dark:text-slate-850" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                      <line x1={paddingLeft} y1="70" x2={paddingLeft + graphWidth} y2="70" stroke="currentColor" className="text-slate-150 dark:text-slate-850" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                      <line x1={paddingLeft} y1="120" x2={paddingLeft + graphWidth} y2="120" stroke="currentColor" className="text-slate-150 dark:text-slate-850" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                      <line x1={paddingLeft} y1="170" x2={paddingLeft + graphWidth} y2="170" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />

                      <path d={buildSmoothAreaPath(createdPoints)} fill="url(#createdGradientGrad)" />
                      <path d={buildSmoothPath(createdPoints)} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

                      <path d={buildSmoothAreaPath(donePoints)} fill="url(#doneGradientGrad)" />
                      <path d={buildSmoothPath(donePoints)} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

                      {createdPoints.map((p, idx) => {
                        const rVal = (hoveredActivityIdx === idx ? hoverRadius : radius) / Math.sqrt(zoomScale);
                        return (
                          <g key={`cr-${idx}`} className="cursor-pointer" onMouseEnter={() => setHoveredActivityIdx(idx)} onMouseLeave={() => setHoveredActivityIdx(null)}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={rVal} 
                              fill="#3b82f6" 
                              stroke="#ffffff" 
                              strokeWidth={2.5 / Math.sqrt(zoomScale)} 
                              vectorEffect="non-scaling-stroke"
                              className="transition-all duration-150 shadow-md"
                            />
                            {hoveredActivityIdx === idx && (
                              <g 
                                className="pointer-events-none"
                                style={{
                                  transform: `scale(${1 / zoomScale})`,
                                  transformOrigin: `${p.x}px ${p.y}px`,
                                  transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                                }}
                              >
                                <rect x={p.x - 30} y={p.y - 36} width="60" height="24" rx="8" fill="#1e293b" className="shadow-xl" />
                                <text x={p.x} y={p.y - 20} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">{p.value}</text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {donePoints.map((p, idx) => {
                        const rVal = (hoveredActivityIdx === (idx + 100) ? hoverRadius : radius) / Math.sqrt(zoomScale);
                        return (
                          <g key={`dn-${idx}`} className="cursor-pointer" onMouseEnter={() => setHoveredActivityIdx(idx + 100)} onMouseLeave={() => setHoveredActivityIdx(null)}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={rVal} 
                              fill="#10b981" 
                              stroke="#ffffff" 
                              strokeWidth={2.5 / Math.sqrt(zoomScale)} 
                              vectorEffect="non-scaling-stroke"
                              className="transition-all duration-150 shadow-md"
                            />
                            {hoveredActivityIdx === (idx + 100) && (
                              <g 
                                className="pointer-events-none"
                                style={{
                                  transform: `scale(${1 / zoomScale})`,
                                  transformOrigin: `${p.x}px ${p.y}px`,
                                  transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                                }}
                              >
                                <rect x={p.x - 30} y={p.y - 36} width="60" height="24" rx="8" fill="#1e293b" className="shadow-xl" />
                                <text x={p.x} y={p.y - 20} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">{p.value}</text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {activityData.map((d, i) => {
                        const x = paddingLeft + i * stepX;
                        
                        // Dynamically determine index interval depending on general zoomScale
                        let labelInterval = 5;
                        if (zoomScale >= 2.5) {
                          labelInterval = 1; // Show all days
                        } else if (zoomScale >= 1.6) {
                          labelInterval = 2; // Show every 2nd day
                        } else if (zoomScale >= 1.25) {
                          labelInterval = 3; // Show every 3rd day
                        }

                        // Display labels gracefully to avoid clutter
                        const isLabelVisible = period !== "Month" || i === 0 || i === count - 1 || (parseInt(d.label) % labelInterval === 0);
                        if (!isLabelVisible) return null;

                        return (
                          <text 
                            key={i} 
                            x={x} 
                            y="194" 
                            textAnchor="middle" 
                            fill="currentColor" 
                            className="text-text-secondary font-extrabold pb-1 select-none"
                            style={{
                              fontSize: `${10 / zoomScale}px`,
                              transition: "font-size 0.15s ease"
                            }}
                          >
                            {d.label}
                          </text>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
              <span className="text-[10px] text-text-secondary font-extrabold uppercase tracking-wider">{t.dashboard.newTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />
              <span className="text-[10px] text-text-secondary font-extrabold uppercase tracking-wider">{t.dashboard.completedTasks}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Task Status Distribution (Premium Donut Chart) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-300">
          <div>
            <h3 className="text-sm font-black text-text-title tracking-tight">{t.dashboard.columnStatuses}</h3>
            <p className="text-[10px] text-text-secondary mt-0.5">{t.dashboard.statusDesc}</p>
          </div>

          <div className="h-44 relative flex items-center justify-center my-2">
            {totalTasks === 0 ? (
              <div className="text-center text-xs text-text-secondary">{t.dashboard.noTasks}</div>
            ) : (
              <svg viewBox="0 0 160 160" className="w-36 h-36 overflow-visible">
                {(() => {
                  let accumulatedOffset = 0;
                  const radius = 54;
                  const strokeWidth = 14;
                  const center = 80;
                  const circ = 2 * Math.PI * radius;

                  const themeColors = [
                    "#3b82f6", // Blue
                    "#10b981", // Green
                    "#f59e0b", // Orange
                    "#8b5cf6", // Purple
                    "#ec4899", // Pink
                    "#06b6d4"  // Cyan
                  ];

                  return statusDistribution.map((item, idx) => {
                    const pct = totalTasks > 0 ? (item.count / totalTasks) * 100 : 0;
                    if (pct === 0) return null;
                    const strokeLength = (pct / 100) * circ;
                    const strokeOffset = -accumulatedOffset;
                    accumulatedOffset += strokeLength;

                    const color = themeColors[idx % themeColors.length];
                    const isHovered = hoveredStatusIdx === idx;

                    return (
                      <circle
                        key={idx}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={13}
                        strokeDasharray={`${strokeLength} ${circ}`}
                        strokeDashoffset={strokeOffset}
                        transform={`rotate(-90 ${center} ${center})`}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          opacity: hoveredStatusIdx !== null ? (isHovered ? 1.0 : 0.35) : 1.0,
                          transform: isHovered ? `rotate(-90deg) scale(1.025)` : `rotate(-90deg) scale(1)`,
                          transformOrigin: `${center}px ${center}px`
                        }}
                        onMouseEnter={() => setHoveredStatusIdx(idx)}
                        onMouseLeave={() => setHoveredStatusIdx(null)}
                      />
                    );
                  });
                })()}

                {/* Mask for Ring chart inside */}
                <circle cx="80" cy="80" r="41" className="fill-white dark:fill-slate-900 shadow-inner" />
                <text x="80" y="78" textAnchor="middle" className="fill-text-title font-black text-[16px] tracking-tight">{completionRate}%</text>
                <text x="80" y="93" textAnchor="middle" className="fill-text-secondary font-extrabold text-[7.5px] uppercase tracking-widest">{t.dashboard.doneInDonut}</text>
              </svg>
            )}

            {/* Float dynamic tooltip indicator of hovered Status slice */}
            <AnimatePresence>
              {hoveredStatusIdx !== null && statusDistribution[hoveredStatusIdx] && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="absolute bg-slate-950 border border-slate-800 text-white py-1.5 px-3.5 text-[10px] font-bold rounded-xl shadow-lg pointer-events-none text-center"
                >
                  <span className="block text-blue-400 font-extrabold uppercase tracking-widest text-[8px] mb-0.5">
                    {statusDistribution[hoveredStatusIdx].name}
                  </span>
                  <span>{statusDistribution[hoveredStatusIdx].count} {t.dashboard.tasksWord} ({Math.round(statusDistribution[hoveredStatusIdx].percentage)}%)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
            {statusDistribution.map((item, idx) => {
              const themeColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
              const color = themeColors[idx % themeColors.length];
              const isHovered = hoveredStatusIdx === idx;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                    isHovered ? "bg-slate-50 dark:bg-zinc-800" : ""
                  }`}
                  onMouseEnter={() => setHoveredStatusIdx(idx)}
                  onMouseLeave={() => setHoveredStatusIdx(null)}
                >
                  <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-semibold text-text-secondary truncate hover:text-text-title block transition-colors">
                    {item.name} <span className="text-text-title font-bold">({item.count})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Priorities (Custom Grid Bar) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-300">
          <div>
            <h3 className="text-sm font-black text-text-title tracking-tight">{t.dashboard.priorityTitle}</h3>
            <p className="text-[10px] text-text-secondary mt-0.5">{t.dashboard.priorityDesc}</p>
          </div>

          <div className="space-y-4 my-2">
            {priorityDistribution.map((item, idx) => {
              const maxCount = Math.max(...priorityDistribution.map(p => p.count), 1);
              const percentWidth = Math.round((item.count / maxCount) * 100);
              const isHovered = hoveredPriorityIdx === idx;
              return (
                <div 
                  key={item.key} 
                  className="space-y-1.5 group cursor-pointer"
                  onMouseEnter={() => setHoveredPriorityIdx(idx)}
                  onMouseLeave={() => setHoveredPriorityIdx(null)}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                    <span className="text-[11px] group-hover:text-text-title transition-colors flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-text-title">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-150 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentWidth}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full transition-all"
                      style={{ 
                        backgroundColor: item.color,
                        boxShadow: isHovered ? `0 0 10px ${item.color}50` : "none"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 text-center text-[10px] text-text-secondary font-bold">
            {totalTasks > 0 ? (
              <span>{t.dashboard.urgentPercentage} {Math.round((priorityDistribution[0].count / totalTasks) * 100)}% {t.dashboard.workload}</span>
            ) : (
              <span>{t.dashboard.normalWorkload}</span>
            )}
          </div>
        </div>
      </div>

      {/* Redesigned Tabbed Checklist Hub / Planner with Smart Insights (lg:col-span-12) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-[28px] p-6 shadow-xs relative flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Dynamic checklist selection tabs & active card renderer  */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
            <h3 className="text-sm font-black text-text-title tracking-wider uppercase">{t.dashboard.taskOrganizer || "Органайзер задач"}</h3>
            
            {/* Navigational Category Selector */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 dark:bg-zinc-950 p-1 border border-slate-250 dark:border-zinc-800 rounded-xl">
              <button
                onClick={() => setActiveListTab("dueToday")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeListTab === "dueToday"
                    ? "bg-white dark:bg-zinc-800 text-blue-500 shadow-sm"
                    : "text-text-secondary hover:text-text-title"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.dashboard.dueToday}</span>
                <span className="font-mono text-[9px] bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.2 rounded-md font-black">
                  {dueTodayCount}
                </span>
              </button>
              
              <button
                onClick={() => setActiveListTab("overdue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeListTab === "overdue"
                    ? "bg-white dark:bg-zinc-800 text-red-500 shadow-sm"
                    : "text-text-secondary hover:text-text-title"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t.dashboard.overdue}</span>
                <span className="font-mono text-[9px] bg-slate-250 dark:bg-zinc-700 px-1.5 py-0.2 rounded-md font-black">
                  {overdueTasksCount}
                </span>
              </button>

              <button
                onClick={() => setActiveListTab("urgent")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeListTab === "urgent"
                    ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm"
                    : "text-text-secondary hover:text-text-title"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{t.dashboard.urgentTasks}</span>
                <span className="font-mono text-[9px] bg-slate-250 dark:bg-zinc-700 px-1.5 py-0.2 rounded-md font-black">
                  {highPriorityCount}
                </span>
              </button>
            </div>
          </div>

          {/* Active List Area */}
          <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(() => {
              let activeList: Card[] = [];
              let emptyStateIcon = <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400 stroke-[1.5]" />;
              let emptyStateTitle = "";
              let emptyStateDesc = "";

              if (activeListTab === "dueToday") {
                activeList = dueTodayList;
                emptyStateTitle = t.dashboard.noDueToday;
                emptyStateDesc = t.dashboard.noDueTodayDesc;
              } else if (activeListTab === "overdue") {
                activeList = overdueTasksList;
                emptyStateTitle = t.dashboard.noOverdue;
                emptyStateDesc = t.dashboard.noOverdueDesc;
              } else {
                activeList = highPriorityList;
                emptyStateIcon = <Flame className="w-10 h-10 text-red-500 dark:text-red-400 stroke-[1.5]" />;
                emptyStateTitle = t.dashboard.noUrgent;
                emptyStateDesc = t.dashboard.noUrgentDesc;
              }

              if (activeList.length === 0) {
                const bgClass = activeListTab === "urgent" 
                  ? "bg-red-500/10 dark:bg-red-500/15 border border-red-200/20 dark:border-red-500/20" 
                  : "bg-green-500/10 dark:bg-green-500/15 border border-green-200/20 dark:border-green-500/20";
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-text-secondary">
                    <div className={`mb-2.5 p-3.5 rounded-full ${bgClass}`}>
                      {emptyStateIcon}
                    </div>
                    <span className="text-xs font-bold text-text-title">{emptyStateTitle}</span>
                    <p className="text-[10px] text-text-secondary px-8 mt-1.5 leading-relaxed max-w-xs">{emptyStateDesc}</p>
                  </div>
                );
              }

              return activeList.map((card) => {
                const assignee = users.find(u => u.id === card.assigneeId);
                return (
                  <motion.div 
                    layout
                    key={card.id} 
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-100/80 dark:border-zinc-800/85 rounded-2xl hover:border-blue-500/20 hover:bg-slate-100/50 dark:hover:bg-zinc-800/60 transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 truncate flex-1 mr-3">
                      <input 
                        type="checkbox"
                        checked={card.completed || false} 
                        onChange={() => handleToggleDone(card)}
                        className="w-4 h-4 rounded border-slate-350 dark:border-zinc-700 text-blue-500 focus:ring-blue-500 cursor-pointer shrink-0 transition-transform hover:scale-105"
                        title={t.dashboard.completeAction}
                      />
                      <div className="truncate flex flex-col">
                        <span 
                          onClick={() => openCardDetails(card)}
                          className={`text-xs font-bold hover:text-blue-500 transition-colors cursor-pointer truncate ${
                            card.completed ? "line-through text-text-secondary font-medium" : "text-text-title"
                          }`}
                        >
                          {card.title}
                        </span>
                        
                        {/* Display Board identifier pill */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {card.boardName && (
                            <span className="text-[8.5px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.2 rounded-md font-bold truncate max-w-[120px]">
                              {card.boardName}
                            </span>
                          )}
                          {card.columnName && (
                            <span className="text-[8.5px] bg-slate-150 dark:bg-zinc-800 text-text-secondary px-1.5 py-0.2 rounded-md font-semibold truncate max-w-[120px]">
                              {t.dashboard.from}: {card.columnName}
                            </span>
                          )}
                          {card.dueDate && (
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-md ${
                              activeListTab === "overdue" ? "bg-red-500/15 text-red-500" : "bg-slate-155 dark:bg-zinc-800 text-text-secondary"
                            }`}>
                              {lang === "en" ? "Due" : "Срок"}: {new Date(card.dueDate).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member profile micro-badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {assignee && (
                        <div className="relative group/user">
                          <img 
                            src={assignee.photoURL || `https://i.pravatar.cc/32?u=${card.assigneeId}`} 
                            className="w-6 h-6 rounded-full border border-white/40 shadow-xs object-cover" 
                            alt={assignee.name || ""} 
                          />
                        </div>
                      )}
                      
                      <button 
                        onClick={() => openCardDetails(card)}
                        className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 border border-slate-200 dark:border-zinc-700 text-text-secondary rounded-xl transition-all ml-1 cursor-pointer"
                        title={t.dashboard.openTask}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>

        {/* Right Side: Smart Performance Coach & Quick Tips panel */}
        <div className="w-full lg:w-72 bg-slate-50 dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shrink-0 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
              <span>●</span> {t.dashboard.smartAssistantTitle}
            </h4>
            
            {/* Dynamic AI metrics recommendation content */}
            {(() => {
              if (overdueTasksCount > 0) {
                return (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      {lang === "en" ? (
                        <>
                          🚨 Detected <span className="text-red-500 font-bold">{overdueTasksCount} overdue tasks</span>. To keep your boards on track, we recommend changing the schedule or redistributing team workload.
                        </>
                      ) : (
                        <>
                          🚨 Обнаружено <span className="text-red-500 font-bold">{overdueTasksCount} просроченных задач</span>. Чтобы не сорвать сроки досок, рекомендуем изменить интервал или перераспределить работу команды.
                        </>
                      )}
                    </p>
                    <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[9.5px] text-red-500 font-semibold leading-normal">
                      {t.dashboard.smartOverdueTip}
                    </div>
                  </div>
                );
              }
              if (dueTodayCount > 0) {
                return (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      {lang === "en" ? (
                        <>
                          📅 There are <span className="text-blue-500 font-bold">{dueTodayCount} tasks</span> scheduled for today. Workload plan is normal. Try to complete high-priority tasks first.
                        </>
                      ) : (
                        <>
                          📅 На сегодня запланировано <span className="text-blue-500 font-bold">{dueTodayCount} задач</span>. План загрузок в норме. Старайтесь выполнять в первую очередь дела высокого уровня.
                        </>
                      )}
                    </p>
                    <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9.5px] text-blue-500 font-semibold leading-normal">
                      {lang === "en" 
                        ? `Today's progress: ${completedTodayCount} of ${dueTodayCount + completedTodayCount} tasks.`
                        : `Прогресс выполнения сегодня: ${completedTodayCount} из ${dueTodayCount + completedTodayCount} задач.`}
                    </div>
                  </div>
                );
              }
              if (highPriorityCount > 3) {
                return (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                      {lang === "en" ? (
                        <>
                          🔥 High workload! You have <span className="text-amber-500 font-bold">{highPriorityCount} incomplete urgent tasks</span>. Try delegating them to available team members.
                        </>
                      ) : (
                        <>
                          🔥 Высокая нагрузка! У вас <span className="text-amber-500 font-bold">{highPriorityCount} невыполненных срочных дел</span>. Постарайтесь делегировать задачи свободным коллегам.
                        </>
                      )}
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-text-secondary leading-relaxed font-semibold text-green-500">
                    {t.dashboard.smartAllCleanTitle}
                  </p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {t.dashboard.smartAllCleanMsg}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800 text-[10px] text-text-secondary">
            <span>{t.dashboard.updatedAsOfToday}</span>
          </div>
        </div>

      </div>
      
      {/* Trash Modal */}
      <AnimatePresence>
        {isTrashModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrashModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col h-[70vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text-title">{t.dashboard.openTrash}</h2>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">
                      {t.dashboard.deletedLabel}: {trashedCards.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTrashModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-50 dark:bg-zinc-900/50">
                {trashedCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                    <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 stroke-1" />
                    <span className="text-sm font-bold">{t.dashboard.trashEmpty}</span>
                    <p className="text-[11px] text-text-secondary px-8 mt-2 max-w-xs leading-relaxed">
                      {t.dashboard.trashDesc}
                    </p>
                  </div>
                ) : (
                  trashedCards.map((card) => {
                    const assignee = users.find(u => u.id === card.assigneeId);
                    const originalColumn = columns.find(c => c.id === card.columnId);
                    return (
                      <div key={card.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-sm hover:border-red-300 dark:hover:border-red-500/30 transition-colors gap-4">
                        <div className="flex items-start gap-3 truncate">
                          <div className="shrink-0 mt-0.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-bold text-text-title truncate">{card.title}</h4>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {card.boardName && (
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold truncate max-w-[150px]">
                                  {card.boardName}
                                </span>
                              )}
                              {originalColumn ? (
                                <span className="text-[10px] bg-slate-100 dark:bg-zinc-700 text-text-secondary px-2 py-0.5 rounded-md font-semibold truncate max-w-[124px]">
                                  {t.dashboard.from}: {originalColumn.name}
                                </span>
                              ) : (
                                card.columnName && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-zinc-700 text-text-secondary px-2 py-0.5 rounded-md font-semibold truncate max-w-[124px]">
                                    {t.dashboard.from}: {card.columnName}
                                  </span>
                                )
                              )}
                              {card.trashedAt && (
                                <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md">
                                  {t.dashboard.deletedLabel}: {new Date(card.trashedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                          {assignee && (
                            <img 
                              src={assignee.photoURL || `https://i.pravatar.cc/32?u=${card.assigneeId}`} 
                              className="w-7 h-7 rounded-full border border-white/20 shadow-xs object-cover" 
                              alt="assignee" 
                            />
                          )}
                          <button
                            onClick={() => {
                              if (onUpdateCardLine) {
                                onUpdateCardLine({ ...card, isTrashed: false, trashedAt: undefined });
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {t.dashboard.restore}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
