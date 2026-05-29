import React, { useState, useEffect } from "react";
import { Plus, Search, Tags, Menu, Moon, Sun } from "lucide-react";
import { Board, User, Tag, Column, Card } from "./types";
import Sidebar from "./components/Sidebar";
import KanbanBoard from "./components/KanbanBoard";
import Dashboard from "./components/Dashboard";
import Templates from "./components/Templates";
import Settings from "./components/Settings";
import TagManager from "./components/TagManager";
import TeamManager from "./components/TeamManager";
import Auth from "./components/Auth";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  orderBy, 
  setDoc, 
  getDoc 
} from "./lib/firebase";
import { firestore } from "./lib/db";
import { User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./lib/i18n";

export default function App() {
  const { t, lang } = useTranslation();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "dashboard" | "templates" | "settings">("board");
  const [columns, setColumns] = useState<Column[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [allTrashedCards, setAllTrashedCards] = useState<Card[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allFirestoreUsers, setAllFirestoreUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [cardPreset, setCardPreset] = useState<"modern" | "flat" | "neon">(() => {
    return (localStorage.getItem("cardPreset") as any) || "modern";
  });

  const addBoard = async () => {
    if (!newBoardName.trim() || !currentUser || isCreatingBoard) return;
    
    setIsCreatingBoard(true);
    try {
      console.log("Creating board...", { name: newBoardName, uid: currentUser.uid });
      const boardId = doc(collection(db, "boards")).id;
      const newBoard = {
        id: boardId,
        name: newBoardName.trim(),
        ownerId: currentUser.uid,
        createdAt: Date.now(),
      };
      
      await firestore.set("boards", boardId, newBoard);
      console.log("Board created, seeding columns...");
      
      const columnNames = lang === "en" 
        ? ["To Do", "In Progress", "Done"] 
        : ["К выполнению", "В работе", "Готово"];
      const seedPromises = columnNames.map((colName, i) => {
        const colId = doc(collection(db, "temp")).id;
        return firestore.set(`boards/${boardId}/columns`, colId, {
          id: colId,
          name: colName,
          order: i,
          sortMode: "manual"
        });
      });
      
      await Promise.all(seedPromises);

      // Add owner to members list
      await firestore.set(`boards/${boardId}/members`, currentUser.uid, {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        email: currentUser.email,
        photoURL: currentUser.photoURL || "",
      });

      console.log("Seed complete. Setting active board:", boardId);
      setActiveBoardId(boardId);
      setIsNewBoardModalOpen(false);
      setNewBoardName("");
    } catch (error) {
      console.error("Error creating board:", error);
      alert(lang === "en"
        ? "Failed to create board. Error: " + (error instanceof Error ? error.message : String(error))
        : "Не удалось создать доску. Ошибка: " + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const toggleDarkMode = async () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem("theme", nextVal ? "dark" : "light");
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { isDarkMode: nextVal }, { merge: true });
      } catch (err) {
        console.error("Error saving theme preference to DB:", err);
      }
    }
  };

  const changeCardPreset = async (preset: "modern" | "flat" | "neon") => {
    setCardPreset(preset);
    localStorage.setItem("cardPreset", preset);
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { cardPreset: preset }, { merge: true });
      } catch (err) {
        console.error("Error saving cardPreset preference to DB:", err);
      }
    }
  };

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // First load existing preferences from user's document
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isDarkMode !== undefined) {
              setIsDarkMode(data.isDarkMode);
              localStorage.setItem("theme", data.isDarkMode ? "dark" : "light");
            }
            if (data.cardPreset !== undefined) {
              setCardPreset(data.cardPreset);
              localStorage.setItem("cardPreset", data.cardPreset);
            }
            if (data.language !== undefined) {
              localStorage.setItem("appLanguage", data.language);
              window.dispatchEvent(new Event('languageChange'));
            }
          }
        } catch (e) {
          console.error("Failed to load user preferences on login:", e);
        }

        // Register/update user in DB
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email,
          photoURL: user.photoURL,
        }, { merge: true });
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Data
  useEffect(() => {
    if (!currentUser) {
      setBoards([]);
      return;
    }

    const q = query(collection(db, "boards"), where("ownerId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bList: Board[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Board));
      
      // Deduplicate boards by ID
      const uniqueBoards = Array.from(new Map(bList.map(b => [b.id, b])).values());
      setBoards(uniqueBoards);
      
      if (uniqueBoards.length > 0 && !activeBoardId) {
        setActiveBoardId(uniqueBoards[0].id);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Ошибка синхронизации досок:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync Tags
  useEffect(() => {
    if (!currentUser || !activeBoardId) {
      setTags([]);
      return;
    }

    const q = query(collection(db, `boards/${activeBoardId}/tags`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      const uniqueTags = Array.from(new Map(tList.map(t => [t.id, t])).values());
      setTags(uniqueTags);
    }, (err) => {
      // Ignore intermediate cache errors
    });

    return () => unsubscribe();
  }, [currentUser, activeBoardId]);

  // Fetch Board Members
  useEffect(() => {
    if (!currentUser || !activeBoardId) {
      setUsers([]);
      return;
    }

    const q = query(collection(db, `boards/${activeBoardId}/members`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const uniqueMembers = Array.from(new Map(mList.map(m => [m.id, m])).values());
      setUsers(uniqueMembers);
    }, (err) => {
      // Ignore intermediate cache errors
    });

    return () => unsubscribe();
  }, [currentUser, activeBoardId]);

  // Sync Columns
  useEffect(() => {
    if (!currentUser || !activeBoardId) {
      setColumns([]);
      return;
    }
    const q = query(collection(db, `boards/${activeBoardId}/columns`), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Column));
      const uniqueCols = Array.from(new Map(cList.map(c => [c.id, c])).values()) as Column[];
      uniqueCols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setColumns(uniqueCols);
    }, (err) => {
      // Ignore intermediate cache errors
    });
    return () => unsubscribe();
  }, [currentUser, activeBoardId]);

  // Sync Cards
  useEffect(() => {
    if (!currentUser || !activeBoardId) {
      setAllCards([]);
      return;
    }
    const q = query(collection(db, `boards/${activeBoardId}/cards`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const crList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      const uniqueCards = Array.from(new Map(crList.map(c => [c.id, c])).values());
      setAllCards(uniqueCards);
    }, (err) => {
      // Ignore intermediate cache errors
    });
    return () => unsubscribe();
  }, [currentUser, activeBoardId]);

  // Auto-delete cards from Trash after specified amount of days
  useEffect(() => {
    if (!activeBoardId || allCards.length === 0) return;
    
    const autoDeleteDaysSetting = localStorage.getItem("trashAutoDeleteDays") || localStorage.getItem(`trashAutoDeleteDays_${activeBoardId}`) || "7";
    if (autoDeleteDaysSetting === "never") return;
    
    const days = parseInt(autoDeleteDaysSetting, 10);
    if (isNaN(days) || days <= 0) return;
    
    const maxAgeMs = days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const expiredCards = allCards.filter(c => c.isTrashed && c.trashedAt && (now - c.trashedAt > maxAgeMs));
    
    if (expiredCards.length > 0) {
      console.log(`Auto-deleting ${expiredCards.length} expired cards from Trash...`);
      expiredCards.forEach(async (c) => {
        try {
          await firestore.delete(`boards/${activeBoardId}/cards`, c.id);
        } catch (e) {
          console.error("Failed to auto-delete expired card:", c.id, e);
        }
      });
    }
  }, [activeBoardId, allCards]);

  // Sync all trashed cards from all boards
  useEffect(() => {
    if (!currentUser || boards.length === 0) {
      setAllTrashedCards([]);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const boardsCardsMap = new Map<string, Card[]>();
    const boardsColumnsMap = new Map<string, Column[]>();

    const updateTrashed = () => {
      const consolidatedTrashed: Card[] = [];
      boardsCardsMap.forEach((cardsList, bId) => {
        const boardCols = boardsColumnsMap.get(bId) || [];
        const trashedInBoard = cardsList
          .filter(c => c.isTrashed)
          .map(c => {
            const originalCol = boardCols.find(col => col.id === c.columnId);
            return {
              ...c,
              columnName: originalCol ? originalCol.name : undefined
            };
          });
        consolidatedTrashed.push(...trashedInBoard);
      });

      // Deduplicate and sort by trashedAt or createdAt desc
      const uniqueTrashed = Array.from(new Map(consolidatedTrashed.map(c => [c.id, c])).values());
      uniqueTrashed.sort((a, b) => (b.trashedAt || b.createdAt) - (a.trashedAt || a.createdAt));

      setAllTrashedCards(uniqueTrashed);
    };

    boards.forEach((board) => {
      // Sync cards of this board
      const qCards = query(collection(db, `boards/${board.id}/cards`), orderBy("createdAt", "desc"));
      const unsubCards = onSnapshot(qCards, (snapshot) => {
        const boardCards = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          boardId: board.id,
          boardName: board.name,
        } as Card));
        boardsCardsMap.set(board.id, boardCards);
        updateTrashed();
      }, (err) => {
        // Ignore cache permission errors
      });
      unsubscribes.push(unsubCards);

      // Sync columns of this board to get column names for trash mapping
      const qCols = query(collection(db, `boards/${board.id}/columns`), orderBy("order", "asc"));
      const unsubCols = onSnapshot(qCols, (snapshot) => {
        const boardCols = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as Column));
        boardsColumnsMap.set(board.id, boardCols);
        updateTrashed();
      }, (err) => {
        // Ignore cache permission errors
      });
      unsubscribes.push(unsubCols);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, boards]);

  // Fetch All Users (for Team Manager selection)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const uniqueUsers = Array.from(new Map(uList.map(u => [u.id, u])).values());
      setAllFirestoreUsers(uniqueUsers);
    }, (err) => {
      console.error("Error fetching all users:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  const resolvedUsers = React.useMemo(() => {
    return users.map(member => {
      const latestUserProfile = allFirestoreUsers.find(u => u.id === member.id);
      if (latestUserProfile) {
        return {
          ...member,
          name: latestUserProfile.name || member.name,
          photoURL: latestUserProfile.photoURL || member.photoURL,
          email: latestUserProfile.email || member.email
        };
      }
      return member;
    });
  }, [users, allFirestoreUsers]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-black">
        <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-transparent text-text-title overflow-hidden font-sans transition-colors duration-300">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar-mask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/10 dark:bg-black/30 z-40 lg:hidden backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      <Sidebar
        boards={boards}
        activeBoardId={activeBoardId}
        setActiveBoardId={(id) => {
          setActiveBoardId(id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onAddBoard={() => setIsNewBoardModalOpen(true)}
        onOpenTeam={() => setIsTeamManagerOpen(true)}
        onDeleteBoard={(id) => {
          if (activeBoardId === id) {
            const index = boards.findIndex(b => b.id === id);
            const nextBoard = boards[index + 1] || boards[index - 1] || null;
            setActiveBoardId(nextBoard?.id || null);
          }
        }}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white/30 dark:bg-black/20 backdrop-blur-md border-b border-white/20 dark:border-white/5 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/90 shadow-sm flex items-center justify-center text-white font-bold text-sm">
                {lang === "en" ? "A" : "В"}
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                {lang === "en" ? "All To The Point" : "ВсеПоДелу"}
              </h1>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-bg-app rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-text-secondary" />}
            </button>
            <button
              onClick={() => setIsTagManagerOpen(true)}
              className="p-2 hover:bg-bg-app rounded-lg relative transition-colors"
            >
              <Tags className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-border-ui shadow-sm ring-1 ring-border-ui relative group cursor-pointer">
              <img src={currentUser.photoURL || `https://i.pravatar.cc/32?u=${currentUser.uid}`} alt="User" />
              <button 
                onClick={() => auth.signOut()}
                className="absolute inset-0 bg-black/60 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center uppercase"
              >
                {t.sidebar.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === "board" && (
            activeBoard ? (
              <KanbanBoard
                board={activeBoard}
                users={resolvedUsers}
                tags={tags}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterAssigneeId={filterAssigneeId}
                setFilterAssigneeId={setFilterAssigneeId}
                isLoading={isLoading}
                onOpenTeam={() => setIsTeamManagerOpen(true)}
                cardPreset={cardPreset}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-xs"
                >
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Plus className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t.board.noActiveBoards || "Нет активных досок"}</h2>
                  <p className="text-text-secondary mb-6">{t.board.createFirstBoardDesc || "Создайте свою первую доску, чтобы начать управлять задачами."}</p>
                  <button
                    onClick={() => setIsNewBoardModalOpen(true)}
                    className="px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-bold hover:bg-[#2563eb] transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                  >
                    {t.board.createBoardBtn || "Создать доску"}
                  </button>
                </motion.div>
              </div>
            )
          )}

          {activeTab === "dashboard" && (
            activeBoard ? (
              <Dashboard
                board={activeBoard}
                columns={columns}
                cards={allCards}
                allTrashedCards={allTrashedCards}
                tags={tags}
                users={resolvedUsers}
                boards={boards}
                onBoardChange={setActiveBoardId}
                onOpenCard={(colId, card) => {
                  setActiveTab("board");
                }}
                onUpdateCardLine={async (updatedCard) => {
                  const bId = updatedCard.boardId || activeBoard.id;
                  
                  // If restoring a card, check if its column needs restoration
                  if (updatedCard.isTrashed === false) {
                    const col = columns.find(c => c.id === updatedCard.columnId);
                    if (col && col.isTrashed) {
                      await firestore.update(`boards/${bId}/columns`, col.id, { isTrashed: false });
                    }
                  }

                  const { boardId, boardName, columnName, ...dbCard } = updatedCard as any;
                  await firestore.set(`boards/${bId}/cards`, updatedCard.id, dbCard);
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-base font-bold mb-1">{t.board.boardNotSelected || "Доска не выбрана"}</h2>
                <p className="text-xs text-text-secondary">{t.board.boardNotSelectedDesc || "Выберите или создайте доску слева для просмотра аналитики."}</p>
              </div>
            )
          )}

          {activeTab === "templates" && (
            <Templates
              currentUser={currentUser}
              onBoardCreated={(boardId) => {
                setActiveBoardId(boardId);
                setActiveTab("board");
              }}
            />
          )}

          {activeTab === "settings" && (
            <Settings
              currentUser={currentUser}
              activeBoard={activeBoard}
              boards={boards}
              columns={columns}
              onRefreshUser={async () => {
                // Refresh local session user reference
              }}
              cardPreset={cardPreset}
              setCardPreset={changeCardPreset}
            />
          )}
        </div>
      </div>

      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        activeBoardId={activeBoardId}
      />

      <TeamManager
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
        members={resolvedUsers}
        allUsers={allFirestoreUsers}
        activeBoardId={activeBoardId}
        currentUserUid={currentUser.uid}
        isOwner={activeBoard?.ownerId === currentUser.uid}
        boardOwnerId={activeBoard?.ownerId || null}
      />

      <AnimatePresence>
        {isNewBoardModalOpen && (
          <div key="new-board-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewBoardModalOpen(false)}
              className="absolute inset-0 bg-slate-900/15 dark:bg-black/45 backdrop-blur-[3px]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-bg-card border border-border-ui w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
              <h2 className="text-xl font-bold mb-4">{t.board.createBoardTitle || "Создать новую доску"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.board.boardNameLabel || "Название доски"}</label>
                  <input
                    autoFocus
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addBoard()}
                    placeholder={t.board.boardNamePlaceholder || "Например: Мой проект"}
                    className="w-full h-12 px-4 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsNewBoardModalOpen(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-text-secondary hover:bg-bg-app transition-all"
                  >
                    {t.board.cancelAction || "Отмена"}
                  </button>
                  <button
                    onClick={addBoard}
                    disabled={!newBoardName.trim() || isCreatingBoard}
                    className="flex-1 h-12 bg-blue-500 disabled:bg-blue-300 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center"
                  >
                    {isCreatingBoard ? (t.board.creatingAction || "Создание...") : (t.board.createAction || "Создать")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

