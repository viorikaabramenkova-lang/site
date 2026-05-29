import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ArrowUpDown, Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, GripHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import { Board, Column, Card, User, Tag } from "../types";
import CardComponent from "./Card";
import CardModal from "./CardModal";
import ConfirmModal from "./ConfirmModal";
import { motion, AnimatePresence, LayoutGroup, Reorder, useDragControls } from "motion/react";
import { firestore } from "../lib/db";
import { db, query, orderBy, collection, onSnapshot, doc } from "../lib/firebase";
import { OperationType } from "../lib/db";

interface KanbanBoardProps {
  board: Board;
  users: User[];
  tags: Tag[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterAssigneeId: string | null;
  setFilterAssigneeId: (id: string | null) => void;
  isLoading: boolean;
  onOpenTeam: () => void;
  cardPreset: "modern" | "flat" | "neon";
}

import { useTranslation } from "../lib/i18n";

const DraggableColumn = ({ reorderValue, column, board, allCards, tags, users, cardPreset, draggedCard, hoveredColumnId, hoveredCardId, hoverPosition, editColumnName, handleDragOverColumn, handleColumnDrop, t, toggleCardComplete, setEditingCard, setConfirmDelete, handleDragStart, handleDragEnd, handleCardDragOver, handleCardDrop, onColumnDragEnd, onColumnDragStart, onMoveColumn, handleMoveCard, isMobile }: any) => {
  const dragControls = useDragControls();
  const isColHovered = hoveredColumnId === column.id;
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const sortOptions = [
    { value: "manual", label: t.board.sortManual || "Вручную" },
    { value: "priority", label: t.board.sortPriority || "По приоритету" },
    { value: "date", label: t.board.sortDate || "По дате" },
  ];

  return (
    <Reorder.Item
      value={reorderValue}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onColumnDragStart}
      onDragEnd={onColumnDragEnd}
      as="div"
      className={`relative w-full lg:w-[310px] flex flex-col h-auto lg:max-h-full group/col shrink-0 rounded-2xl p-4 glass-panel border transition-colors duration-300 ${
        isColHovered 
          ? "border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/5 shadow-md" 
          : "border-white/20 dark:border-white/5"
      }`}
    >
      <div 
        className="flex-1 flex flex-col min-h-0"
        onDragOver={(e) => handleDragOverColumn(e, column.id)}
        onDrop={(e) => handleColumnDrop(e, column.id)}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 max-w-[200px]">
            <div
              className="cursor-grab active:cursor-grabbing text-text-secondary/50 hover:text-text-title transition-colors p-1 -ml-1 rounded-md hover:bg-white/10 dark:hover:bg-black/20 touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              title={t.board?.dragColumn || "Drag column"}
            >
              <GripHorizontal className="w-4 h-4" />
            </div>
            <h3
              className="text-sm font-bold text-text-title truncate cursor-pointer hover:text-blue-500 transition-colors select-none"
              onDoubleClick={() => editColumnName(column.id, column.name)}
            >
              {column.name}
            </h3>
            <span className="text-[10px] bg-white/20 dark:bg-black/15 text-text-secondary px-2 py-0.5 rounded-full font-bold">
              {column.cards?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-1 lg:opacity-0 group-hover/col:opacity-100 transition-opacity relative">
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="p-1 hover:bg-white/20 dark:hover:bg-black/25 rounded cursor-pointer"
              title={t.board.sortTooltip || "Сортировка"}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
            </button>
            {isSortMenuOpen && (
              <div className="absolute top-8 right-0 z-50 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 py-1 overflow-hidden">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={async () => {
                      await firestore.update(`boards/${board.id}/columns`, column.id, { sortMode: opt.value });
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 ${column.sortMode === opt.value ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-text-secondary"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 lg:hidden bg-black/5 dark:bg-white/5 rounded-lg p-1 ml-2">
              <button 
                onClick={() => onMoveColumn?.(column.id, 'up')} 
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer text-text-secondary transition-colors"
                title="Move column up/left"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-border/20"></div>
              <button 
                onClick={() => onMoveColumn?.(column.id, 'down')} 
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer text-text-secondary transition-colors"
                title="Move column down/right"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setConfirmDelete({ type: 'column', id: column.id })} 
              className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
              title={t.board.deleteColTooltip || "Удалить колонку"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 lg:overflow-y-auto min-h-[100px] px-1.5 pt-2.5 no-scrollbar pb-2">
          <div className="space-y-3 pb-2 flex flex-col h-full relative">
            <AnimatePresence>
              {column.cards?.map((card: Card) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  tags={tags}
                  users={users}
                  onClick={() => setEditingCard({ colId: column.id, card })}
                  onDelete={() => setConfirmDelete({ type: 'card', id: card.id })}
                  preset={cardPreset}
                  onToggleComplete={() => toggleCardComplete(card)}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleCardDragOver(e, card)}
                  onDrop={(e) => handleCardDrop(e, card)}
                  isDragging={draggedCard?.id === card.id}
                  hoverPosition={hoveredCardId === card.id ? hoverPosition : null}
                  onMoveCard={(dir, e) => handleMoveCard?.(card, dir, e)}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
            
            {(!column.cards || column.cards.length === 0) && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 dark:border-white/5 rounded-2xl py-8 text-xs text-text-secondary/70">
                {t.board.dragHere || "Перетащите сюда"}
              </div>
            )}
          </div>

          <button
            onClick={() => setEditingCard({ colId: column.id, card: null })}
            className="w-full py-3 mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 dark:border-white/5 text-text-secondary text-xs font-semibold hover:border-blue-500 hover:text-blue-500 hover:bg-white/20 dark:hover:bg-black/25 transition-all mb-4 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.board.addTask}
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
};

export default function KanbanBoard({
  board,
  users,
  tags,
  searchQuery,
  setSearchQuery,
  filterAssigneeId,
  setFilterAssigneeId,
  isLoading: isGlobalLoading,
  onOpenTeam,
  cardPreset,
}: KanbanBoardProps) {
  const { t } = useTranslation();
  const [columns, setColumns] = useState<Column[]>([]);
  const [internalColumns, setInternalColumns] = useState<Column[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isDraggingColumnRef = React.useRef(false);
  
  const boardContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [editingCard, setEditingCard] = useState<{ colId: string; card: Card | null } | null>(null);
  const [isNewColModalOpen, setIsNewColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'column' | 'card', id: string, extra?: string } | null>(null);

  // HTML5 Drag and Drop state
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [initialDragState, setInitialDragState] = useState<{ columnId: string; order: number } | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<"top" | "bottom" | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);

  const isDraggingActiveRef = React.useRef(false);
  isDraggingActiveRef.current = draggedCard !== null;

  const isDropHandledRef = React.useRef(false);
  const dragStartTimestampRef = React.useRef<number>(0);
  const lastDragOverTimeRef = React.useRef<number>(0);
  const lastUpdateRef = React.useRef<number>(0);

  const handleFirestoreError = (error: any, type: OperationType, path: string) => {
    if (error.code === 'permission-denied') return; // Ignore expected caching errors on deleted subcollections
    console.error(`Firestore Error [${type}] at ${path}:`, error);
  };

  // Sync Columns
  useEffect(() => {
    const q = query(collection(db, `boards/${board.id}/columns`), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      if (isDraggingColumnRef.current) return;
      const cList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Column)).filter(c => !c.isTrashed);
      const uniqueCols = Array.from(new Map(cList.map(c => [c.id, c])).values()) as Column[];
      // Explicitly sort columns by order to support offline/local storage where queryOrderBy is simulated
      uniqueCols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setColumns(uniqueCols);
      setInternalColumns(uniqueCols);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `boards/${board.id}/columns`);
    });
  }, [board.id]);

  // Sync Cards
  useEffect(() => {
    const q = query(collection(db, `boards/${board.id}/cards`), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      if (isDraggingActiveRef.current) return; // Prevent overwriting optimistic state during drag
      const crList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      const uniqueCards = Array.from(new Map(crList.map(c => [c.id, c])).values());
      setAllCards(uniqueCards);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `boards/${board.id}/cards`);
    });
  }, [board.id]);

  // Safety checks for dragging inside iframe & handling out-of-bounds drag release
  useEffect(() => {
    if (!draggedCard) return;

    const forceCancelDrag = () => {
      handleDragEnd(null, true);
    };

    const handleWindowDragOver = () => {
      lastDragOverTimeRef.current = Date.now();
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      // If the cursor moves inside the site and we aren't clicking (detected after dragover silence), the drag ended outside
      const timeSinceLastDragOver = Date.now() - lastDragOverTimeRef.current;
      if (timeSinceLastDragOver > 800 && e.buttons === 0) {
        forceCancelDrag();
      }
    };

    const handleWindowMouseEnter = (e: MouseEvent) => {
      // Re-entering the window while not clicking (detected after dragover silence) means the drag ended elsewhere
      const timeSinceLastDragOver = Date.now() - lastDragOverTimeRef.current;
      if (timeSinceLastDragOver > 800 && e.buttons === 0) {
        forceCancelDrag();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        forceCancelDrag();
      }
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseenter", handleWindowMouseEnter);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseenter", handleWindowMouseEnter);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggedCard, initialDragState]);

  const addColumn = async () => {
    if (!newColName.trim() || isCreatingColumn) return;
    setIsCreatingColumn(true);
    try {
      const colId = doc(collection(db, "temp")).id;
      await firestore.set(`boards/${board.id}/columns`, colId, {
        id: colId,
        name: newColName.trim(),
        order: columns.length,
        sortMode: "manual",
      });
      setNewColName("");
      setIsNewColModalOpen(false);
    } catch (err) {
      console.error("Failed to add column:", err);
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const deleteColumn = async (colId: string) => {
    try {
      await firestore.update(`boards/${board.id}/columns`, colId, {
        isTrashed: true,
      });
      
      // Also trash all cards in this column to ensure they are excluded from analytics
      const cardsInCol = allCards.filter(c => c.columnId === colId && !c.isTrashed);
      for (const card of cardsInCol) {
        await firestore.update(`boards/${board.id}/cards`, card.id, {
          isTrashed: true,
          trashedAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Failed to delete column:", err);
      alert(t.board.errDeleteCol || "Не удалось удалить колонку.");
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await firestore.update(`boards/${board.id}/cards`, cardId, {
        isTrashed: true,
        trashedAt: Date.now()
      });
    } catch (err) {
      console.error("Failed to trash card:", err);
      alert(t.board.errMoveTrash || "Не удалось переместить карточку в корзину.");
    }
  };

  const playCompletionSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const playTone = (freq: number, startTime: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Pure sine wave gives that clear, glass-like bell sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        // Very quick attack for the glass tap effect
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
        // Long smooth exponential tail
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // High-pitched, clear double chime (like a gentle notification bell)
      playTone(1046.50, now, 0.6, 0.06); // C6 bell tap
      playTone(1318.51, now + 0.1, 0.9, 0.08); // E6 sustained ring
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const toggleCardComplete = async (card: Card) => {
    try {
      const isNowCompleted = !card.completed;
      if (isNowCompleted) {
        playCompletionSound();
      }
      
      await firestore.update(`boards/${board.id}/cards`, card.id, {
        completed: isNowCompleted,
        completedAt: isNowCompleted ? Date.now() : null,
      });
    } catch (err) {
      console.error("Failed to toggle card completion:", err);
    }
  };

  const editColumnName = async (colId: string, currentName: string) => {
    const newName = prompt(t.board.renameColPrompt || "Новое название колонки:", currentName);
    if (newName && newName !== currentName) {
      await firestore.update(`boards/${board.id}/columns`, colId, { name: newName });
    }
  };

  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      let cards = allCards.filter(c => c.columnId === col.id && !c.isTrashed);

      // Search and Assignee filter
      if (searchQuery || filterAssigneeId !== null) {
        cards = cards.filter((card) => {
          const matchesSearch =
            card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (card.description || "").toLowerCase().includes(searchQuery.toLowerCase());
          const matchesAssignee = filterAssigneeId === null || card.assigneeId === filterAssigneeId;
          return matchesSearch && matchesAssignee;
        });
      }

      // Sort logic
      if (col.sortMode === "priority") {
        const pMap: any = { high: 0, medium: 1, low: 2 };
        cards.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
      } else if (col.sortMode === "date") {
        cards.sort((a, b) => b.createdAt - a.createdAt);
      } else {
        cards.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
      }

      return { ...col, cards };
    });
  }, [columns, allCards, searchQuery, filterAssigneeId]);

  // Drag-and-drop handlers
  const handleColumnDragStart = () => {
    isDraggingColumnRef.current = true;
    document.body.classList.add('dragging-column');
  };

  const handleColumnReorder = (newOrder: Column[]) => {
    setInternalColumns(newOrder);
  };

  const handleColumnDragEnd = async () => {
    try {
      const updates = internalColumns.map((col, index) => {
        const matchingOriginal = columns.find(c => c.id === col.id);
        if (matchingOriginal && matchingOriginal.order !== index) {
          return firestore.update(`boards/${board.id}/columns`, col.id, { order: index });
        }
        return Promise.resolve();
      });
      await Promise.all(updates);
    } catch (err) {
      console.error("Failed to reorder columns", err);
    } finally {
      isDraggingColumnRef.current = false;
      document.body.classList.remove('dragging-column');
    }
  };

  const moveColumn = async (colId: string, direction: 'up' | 'down') => {
    const currentIndex = internalColumns.findIndex(c => c.id === colId);
    if (currentIndex === -1) return;
    let targetIndex = currentIndex + (direction === 'up' ? -1 : 1);
    
    if (targetIndex >= 0 && targetIndex < internalColumns.length) {
      const newOrder = [...internalColumns];
      [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
      setInternalColumns(newOrder); // Optimistic UI
      
      try {
        const updates = newOrder.map((col, index) => {
          return firestore.update(`boards/${board.id}/columns`, col.id, { order: index });
        });
        await Promise.all(updates);
      } catch (err) {
        console.error("Failed to move column", err);
      }
    }
  };

  const moveCard = async (card: Card, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceColIndex = internalColumns.findIndex(c => c.id === card.columnId);
    if (sourceColIndex === -1) return;
    
    const colCards = filteredColumns.find(c => c.id === card.columnId)?.cards || [];
    const cardIndex = colCards.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    if (direction === 'up') {
      if (cardIndex > 0) {
        const targetCard = colCards[cardIndex - 1];
        const newOrder = calculateNewOrder(card.columnId, targetCard.id, 'top');
        
        // Optimistic update
        setAllCards(prev => prev.map(c => c.id === card.id ? { ...c, order: newOrder } : c));
        await firestore.update(`boards/${board.id}/cards`, card.id, { order: newOrder });
      } else {
        const targetColIndex = sourceColIndex - 1;
        if (targetColIndex >= 0) {
          const targetColId = internalColumns[targetColIndex].id;
          const targetCards = allCards.filter(c => c.columnId === targetColId && !c.isTrashed);
          const maxOrder = targetCards.length > 0 ? Math.max(...targetCards.map(c => c.order ?? 0)) : 0;
          
          setAllCards(prev => prev.map(c => c.id === card.id ? { ...c, columnId: targetColId, order: maxOrder + 1000 } : c));
          await firestore.update(`boards/${board.id}/cards`, card.id, { 
            columnId: targetColId, 
            order: maxOrder + 1000 
          });
        }
      }
    } else if (direction === 'down') {
      if (cardIndex < colCards.length - 1) {
        const targetCard = colCards[cardIndex + 1];
        const newOrder = calculateNewOrder(card.columnId, targetCard.id, 'bottom');
        
        // Optimistic update
        setAllCards(prev => prev.map(c => c.id === card.id ? { ...c, order: newOrder } : c));
        await firestore.update(`boards/${board.id}/cards`, card.id, { order: newOrder });
      } else {
        const targetColIndex = sourceColIndex + 1;
        if (targetColIndex < internalColumns.length) {
          const targetColId = internalColumns[targetColIndex].id;
          const targetCards = allCards.filter(c => c.columnId === targetColId && !c.isTrashed);
          const minOrder = targetCards.length > 0 ? Math.min(...targetCards.map(c => c.order ?? 0)) : 0;
          
          setAllCards(prev => prev.map(c => c.id === card.id ? { ...c, columnId: targetColId, order: minOrder - 1000 } : c));
          await firestore.update(`boards/${board.id}/cards`, card.id, { 
            columnId: targetColId, 
            order: minOrder - 1000 
          });
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    isDropHandledRef.current = false;
    dragStartTimestampRef.current = Date.now();
    lastDragOverTimeRef.current = Date.now();

    // Set native dataTransfer synchronously so browser recognizes it
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";

    setInitialDragState({
      columnId: card.columnId || "",
      order: card.order ?? card.createdAt,
    });

    // Defer resetting the layout to placeholder state so the browser captures the card screenshot
    setTimeout(() => {
      setDraggedCard(card);
    }, 0);
  };

  const handleDragEnd = async (e?: React.DragEvent | null, isCancelledForcefully: boolean = false) => {
    const isCancelled = isCancelledForcefully || !isDropHandledRef.current;

    if (draggedCard && initialDragState) {
      if (isCancelled) {
        // Revert card state back to the original column and order if needed
        setAllCards((prev) =>
          prev.map((c) =>
            c.id === draggedCard.id
              ? { ...c, columnId: initialDragState.columnId, order: initialDragState.order }
              : c
          )
        );
      }
    }

    setDraggedCard(null);
    setInitialDragState(null);
    setHoveredCardId(null);
    setHoverPosition(null);
    setHoveredColumnId(null);
    lastUpdateRef.current = 0;
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    lastDragOverTimeRef.current = Date.now();
    if (hoveredColumnId !== colId) {
      setHoveredColumnId(colId);
    }
  };

  const calculateNewOrder = (targetColId: string, targetCardId: string | null, position: "top" | "bottom" | null) => {
    const targetColCards = allCards
      .filter((c) => c.columnId === targetColId && c.id !== draggedCard?.id && !c.isTrashed)
      .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

    if (!targetCardId) {
      if (targetColCards.length > 0) {
        const lastVal = targetColCards[targetColCards.length - 1];
        return (lastVal.order ?? lastVal.createdAt) + 1000;
      }
      return Date.now();
    }

    const targetIndex = targetColCards.findIndex((c) => c.id === targetCardId);
    if (targetIndex === -1) return Date.now();

    if (position === "top") {
      if (targetIndex <= 0) {
        const firstVal = targetColCards[0] ? (targetColCards[0].order ?? targetColCards[0].createdAt) : Date.now();
        return firstVal - 1000;
      } else {
        const prevVal = targetColCards[targetIndex - 1].order ?? targetColCards[targetIndex - 1].createdAt;
        const currVal = targetColCards[targetIndex].order ?? targetColCards[targetIndex].createdAt;
        return (prevVal + currVal) / 2;
      }
    } else {
      if (targetIndex >= targetColCards.length - 1) {
        const lastVal = targetColCards[targetColCards.length - 1].order ?? targetColCards[targetColCards.length - 1].createdAt;
        return lastVal + 1000;
      } else {
        const currVal = targetColCards[targetIndex].order ?? targetColCards[targetIndex].createdAt;
        const nextVal = targetColCards[targetIndex + 1].order ?? targetColCards[targetIndex + 1].createdAt;
        return (currVal + nextVal) / 2;
      }
    }
  };

  const handleCardDragOver = (e: React.DragEvent, targetCard: Card) => {
    e.preventDefault();
    e.stopPropagation();
    lastDragOverTimeRef.current = Date.now();
    if (!draggedCard || draggedCard.id === targetCard.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTop = relativeY < rect.height / 2;
    const position = isTop ? "top" : "bottom";

    if (hoveredCardId !== targetCard.id || hoverPosition !== position || hoveredColumnId !== targetCard.columnId) {
      setHoveredCardId(targetCard.id);
      setHoverPosition(position);
      setHoveredColumnId(targetCard.columnId || null);
    }
  };

  const commitDragPosition = async (targetColId: string, newOrder: number) => {
    if (!draggedCard) return;
    
    // Update local state instantly so it immediately drops into place
    setAllCards((prev) =>
      prev.map((c) => (c.id === draggedCard.id ? { ...c, columnId: targetColId, order: newOrder } : c))
    );
    
    try {
      await firestore.update(`boards/${board.id}/cards`, draggedCard.id, {
        columnId: targetColId,
        order: newOrder,
      });
    } catch (err) {
      console.error("Failed to persist final drag position to Firestore:", err);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetCard: Card) => {
    e.preventDefault();
    e.stopPropagation();
    isDropHandledRef.current = true;
    
    if (draggedCard && draggedCard.id !== targetCard.id && targetCard.columnId) {
      const newOrder = calculateNewOrder(targetCard.columnId, targetCard.id, hoverPosition);
      commitDragPosition(targetCard.columnId, newOrder);
    }
    
    setDraggedCard(null);
    setInitialDragState(null);
    setHoveredCardId(null);
    setHoverPosition(null);
    setHoveredColumnId(null);
  };

  const handleColumnDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    isDropHandledRef.current = true;
    
    if (draggedCard) {
      const newOrder = calculateNewOrder(columnId, null, null);
      commitDragPosition(columnId, newOrder);
    }
    
    setDraggedCard(null);
    setInitialDragState(null);
    setHoveredCardId(null);
    setHoverPosition(null);
    setHoveredColumnId(null);
  };

  const handleBoardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    isDropHandledRef.current = true;
    
    if (draggedCard && hoveredColumnId) {
      const newOrder = calculateNewOrder(hoveredColumnId, hoveredCardId, hoverPosition);
      commitDragPosition(hoveredColumnId, newOrder);
    }
    
    setDraggedCard(null);
    setInitialDragState(null);
    setHoveredCardId(null);
    setHoverPosition(null);
    setHoveredColumnId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      {/* Board Header Toolbar */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 dark:border-white/5 bg-white/15 dark:bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-text-title">{board.name}</h2>
          <div className="h-4 w-px bg-white/20 dark:bg-white/5 hidden sm:block" />
          <div className="flex -space-x-2 overflow-hidden">
            {users.slice(0, 5).map((u) => (
              <button
                key={u.id}
                onClick={() => setFilterAssigneeId(filterAssigneeId === u.id ? null : u.id)}
                className={`inline-block h-8 w-8 rounded-full ring-2 ring-white/40 dark:ring-black/20 hover:ring-blue-500 transition-all ${
                  filterAssigneeId === u.id ? "ring-blue-500 scale-110 z-10" : ""
                }`}
                title={u.name}
              >
                <img className="h-full w-full object-cover rounded-full" src={u.photoURL || `https://i.pravatar.cc/32?u=${u.id}`} alt={u.name} />
              </button>
            ))}
            {users.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 dark:bg-black/20 text-[10px] font-bold text-text-secondary ring-2 ring-white/40 dark:ring-black/20 backdrop-blur-xs">
                +{users.length - 5}
              </div>
            )}
            <button
              onClick={onOpenTeam}
              className="ml-2 h-8 w-8 rounded-full border-2 border-dashed border-white/30 dark:border-white/10 text-text-secondary hover:border-blue-500 hover:text-blue-500 hover:bg-white/20 dark:hover:bg-black/25 transition-all flex items-center justify-center cursor-pointer"
              title={t.board.teamManage}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
          {filterAssigneeId !== null && (
            <button
              onClick={() => setFilterAssigneeId(null)}
              className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
            >
              {t.board.resetFilter}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-40 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.sidebar.search}
              className="w-full h-9 pl-9 pr-4 bg-white/40 dark:bg-black/15 border border-white/20 dark:border-white/5 rounded-xl text-xs focus:bg-white/80 dark:focus:bg-black/30 focus:border-blue-500 outline-none transition-all shadow-xs"
            />
          </div>
          <button
            onClick={() => setIsNewColModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/45 dark:bg-black/25 border border-white/20 dark:border-white/5 rounded-xl text-sm font-semibold text-text-title hover:bg-white/60 dark:hover:bg-black/40 transition-all shadow-xs cursor-pointer inline-flex whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t.board.addColumn}
          </button>
        </div>
      </div>

      {/* Board Layout */}
      <div className="flex-1 min-h-0 relative group/board">
        {/* Scroll Left Button */}
        <button
          onClick={scrollLeft}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 shadow-lg cursor-pointer transition-all opacity-0 group-hover/board:opacity-100 hover:scale-105 active:scale-95 duration-200 hidden lg:flex items-center justify-center animate-in fade-in zoom-in"
          title={t.board.scrollLeft}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scroll Right Button */}
        <button
          onClick={scrollRight}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 shadow-lg cursor-pointer transition-all opacity-0 group-hover/board:opacity-100 hover:scale-105 active:scale-95 duration-200 hidden lg:flex items-center justify-center animate-in fade-in zoom-in"
          title={t.board.scrollRight}
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div 
          ref={boardContainerRef}
          className="w-full h-full overflow-y-auto lg:overflow-x-auto p-4 lg:p-6 no-scrollbar"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleBoardDrop}
        >
          {isMobile ? (
            <LayoutGroup>
              <Reorder.Group 
                axis="y"
                values={internalColumns} 
                onReorder={handleColumnReorder}
                className="flex flex-col lg:flex-row gap-8 lg:gap-6 min-w-0 lg:min-w-max lg:h-full items-start pb-10 lg:pb-4"
              >
                {internalColumns.map((col) => {
                  const fullColumn = filteredColumns.find((c) => c.id === col.id) || { ...col, cards: [] };
                  return (
                    <DraggableColumn
                      key={col.id}
                      reorderValue={col}
                      column={fullColumn}
                      board={board}
                      allCards={allCards}
                      tags={tags}
                      users={users}
                      cardPreset={cardPreset}
                      draggedCard={draggedCard}
                      hoveredColumnId={hoveredColumnId}
                      hoveredCardId={hoveredCardId}
                      hoverPosition={hoverPosition}
                      editColumnName={editColumnName}
                      handleDragOverColumn={handleDragOverColumn}
                      handleColumnDrop={handleColumnDrop}
                      t={t}
                      toggleCardComplete={toggleCardComplete}
                      setEditingCard={setEditingCard}
                      setConfirmDelete={setConfirmDelete}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                      handleCardDragOver={handleCardDragOver}
                      handleCardDrop={handleCardDrop}
                      onColumnDragStart={handleColumnDragStart}
                      onColumnDragEnd={handleColumnDragEnd}
                      onMoveColumn={moveColumn}
                      handleMoveCard={moveCard}
                      isMobile={isMobile}
                    />
                  );
                })}
              </Reorder.Group>
            </LayoutGroup>
          ) : (
            <Reorder.Group 
              axis="x"
              values={internalColumns} 
              onReorder={handleColumnReorder}
              className="flex flex-col lg:flex-row gap-8 lg:gap-6 min-w-0 lg:min-w-max lg:h-full items-start pb-10 lg:pb-4"
            >
              {internalColumns.map((col) => {
                const fullColumn = filteredColumns.find((c) => c.id === col.id) || { ...col, cards: [] };
                return (
                  <DraggableColumn
                    key={col.id}
                    reorderValue={col}
                    column={fullColumn}
                    board={board}
                    allCards={allCards}
                    tags={tags}
                    users={users}
                    cardPreset={cardPreset}
                    draggedCard={draggedCard}
                    hoveredColumnId={hoveredColumnId}
                    hoveredCardId={hoveredCardId}
                    hoverPosition={hoverPosition}
                    editColumnName={editColumnName}
                    handleDragOverColumn={handleDragOverColumn}
                    handleColumnDrop={handleColumnDrop}
                    t={t}
                    toggleCardComplete={toggleCardComplete}
                    setEditingCard={setEditingCard}
                    setConfirmDelete={setConfirmDelete}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    handleCardDragOver={handleCardDragOver}
                    handleCardDrop={handleCardDrop}
                    onColumnDragStart={handleColumnDragStart}
                    onColumnDragEnd={handleColumnDragEnd}
                    onMoveColumn={moveColumn}
                    handleMoveCard={moveCard}
                    isMobile={isMobile}
                  />
                );
              })}
            </Reorder.Group>
          )}
        </div>
    </div>

      <AnimatePresence>
        {isNewColModalOpen && (
          <div key="new-column-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewColModalOpen(false)}
              className="absolute inset-0 bg-slate-900/15 dark:bg-black/45 backdrop-blur-[3px]"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="glass-panel w-full max-w-sm rounded-[1.75rems] p-6 shadow-2xl relative border border-white/20 dark:border-white/5 rounded-3xl"
            >
              <h2 className="text-lg font-bold mb-4">{t.board.addColumn}</h2>
              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addColumn()}
                  placeholder={t.board.colPlaceholder || "Название (например: В ожидании)"}
                  className="w-full h-11 px-4 bg-white/30 dark:bg-black/15 border border-white/10 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 transition-all font-semibold text-sm disabled:opacity-50"
                  disabled={isCreatingColumn}
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsNewColModalOpen(false)} disabled={isCreatingColumn} className="flex-1 py-2 rounded-lg font-bold text-text-secondary hover:bg-white/20 dark:hover:bg-black/10 transition-colors cursor-pointer text-xs disabled:opacity-50">{t.board.cancelAction}</button>
                  <button onClick={addColumn} disabled={isCreatingColumn} className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-bold text-xs hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {isCreatingColumn && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <span>{isCreatingColumn ? (t.board.creatingAction || "Создание...") : (t.board.createAction || "Создать")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {editingCard && (
          <CardModal
            key={editingCard.card?.id || "new-card"}
            isOpen={!!editingCard}
            onClose={() => setEditingCard(null)}
            card={editingCard.card}
            onSave={async (updatedCard) => {
              const targetColId = updatedCard.columnId || editingCard.colId;
              const cardData = { ...updatedCard, columnId: targetColId };
              await firestore.set(`boards/${board.id}/cards`, updatedCard.id, cardData);
              setEditingCard(null);
            }}
            users={users}
            tags={tags}
            columns={columns}
          />
        )}
        {confirmDelete && (
          <ConfirmModal
            isOpen={!!confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => {
              if (!confirmDelete) return;
              if (confirmDelete.type === 'column') deleteColumn(confirmDelete.id);
              else if (confirmDelete.type === 'card') deleteCard(confirmDelete.id);
            }}
            title={confirmDelete?.type === 'column' ? t.board.confirmDeleteHeading : t.board.confirmCardDeleteHeading}
            message={confirmDelete?.type === 'column' 
              ? t.board.confirmDeleteText
              : t.board.confirmCardDeleteText}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
