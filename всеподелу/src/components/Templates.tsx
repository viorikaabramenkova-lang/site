import React, { useState } from "react";
import { 
  Plus, 
  Code, 
  Megaphone, 
  Smile, 
  Cpu, 
  CheckCircle2, 
  Rocket, 
  Sparkles,
  X 
} from "lucide-react";
import { Board, User, Priority } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { db, doc, collection } from "../lib/firebase";
import { firestore } from "../lib/db";
import { useTranslation } from "../lib/i18n";

interface TemplatesProps {
  currentUser: any;
  onBoardCreated: (boardId: string) => void;
}

export default function Templates({ currentUser, onBoardCreated }: TemplatesProps) {
  const { t, lang } = useTranslation();
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const templatesList = [
    {
      id: "software-scrum",
      icon: <Code className="w-6 h-6 text-blue-500" />,
      title: lang === "en" ? "Software Development (Scrum)" : "Разработка ПО (Scrum)",
      description: lang === "en" 
        ? "Optimal set of columns for running a software project: backlog, sprint, code-review and finished build." 
        : "Оптимальный набор колонок для ведения софтверного проекта: бэклог, спринт, код-ревью и готовый билд.",
      columns: lang === "en"
        ? ["Product Backlog", "In Sprint", "Code Review", "Testing", "Released to Prod"]
        : ["Бэклог продукта", "В спринте", "Код-ревью", "Тестирование", "Выпущено в прод"],
      tasks: lang === "en" ? [
        { title: "Implement OAuth authorization", desc: "Add sign in with Google and Github on the server side of the panel.", priority: Priority.HIGH },
        { title: "Design dashboard layout", desc: "Create interactive SVG charts and key metric cards.", priority: Priority.MEDIUM },
        { title: "Refactor state manager", desc: "Remove redundant re-renders from the main App component and pull out selectors.", priority: Priority.LOW },
        { title: "Write integration tests", desc: "Check correctness of moving tasks between states with drag-and-drop.", priority: Priority.MEDIUM },
      ] : [
        { title: "Реализовать OAuth-авторизацию", desc: "Добавить вход через Google и Github на серверной стороне панели.", priority: Priority.HIGH },
        { title: "Разработать дизайн дашборда", desc: "Оформить интерактивные SVG-графики и карточки ключевых метрик.", priority: Priority.MEDIUM },
        { title: "Отрефакторить стейт-менеджер", desc: "Убрать лишние ререндеры из главного компонента App и вынести селекторы.", priority: Priority.LOW },
        { title: "Написать интеграционные тесты", desc: "Проверить корректность перемещения задач между стейтами при драг-н-дропе.", priority: Priority.MEDIUM },
      ]
    },
    {
      id: "marketing-camp",
      icon: <Megaphone className="w-6 h-6 text-indigo-500" />,
      title: lang === "en" ? "Marketing Campaign" : "Маркетинговая кампания",
      description: lang === "en"
        ? "Launching promos, contextual advertising, and traffic analysis. Perfect for marketers and SMM specialists."
        : "Запуск промо, контекстная реклама и анализ трафика. Отлично подходит для маркетологов и SMM-специалистов.",
      columns: lang === "en"
        ? ["Ideas & Trends", "Content Plan", "Promo Design", "Target Active", "Done / Analytics"]
        : ["Идеи & Тренды", "Контент-план", "Дизайн промо", "Запущено в таргет", "Готово / Аналитика"],
      tasks: lang === "en" ? [
        { title: "Create advertising banners", desc: "Design 3 creative formats for social networks in dark style.", priority: Priority.HIGH },
        { title: "Write promo copy", desc: "Prepare 5 different offers for different target audiences.", priority: Priority.MEDIUM },
        { title: "Setup retargeting in ad cabinet", desc: "Set audience by pixel visits over the last 30 days.", priority: Priority.HIGH },
        { title: "Record unpacking video", desc: "Publish a short teaser of the new interface in Shorts and Reels.", priority: Priority.LOW },
      ] : [
        { title: "Создать рекламные баннеры", desc: "Оформить 3 формата креативов для социальных сетей в темном стиле.", priority: Priority.HIGH },
        { title: "Написать промо-тексты", desc: "Подготовить 5 различных офферов для разной целевой аудитории.", priority: Priority.MEDIUM },
        { title: "Настроить ретаргетинг в кабинете", desc: "Задать аудитории по пикселям посещений за последние 30 дней.", priority: Priority.HIGH },
        { title: "Записать видео-распаковку", desc: "Опубликовать в Shorts и Reels короткий тизер нового интерфейса.", priority: Priority.LOW },
      ]
    },
    {
      id: "personal-todo",
      icon: <Smile className="w-6 h-6 text-emerald-500" />,
      title: lang === "en" ? "Personal Tasks & Productivity" : "Личные дела & Продуктивность",
      description: lang === "en"
        ? "Simple kanban for controlling life balance, sports, hobbies, and everyday shopping."
        : "Простой канбан для контроля жизненного баланса, спорта, хобби и повседневных покупок.",
      columns: lang === "en"
        ? ["Inbox", "Planned", "In Progress", "Done!"]
        : ["Хочу сделать", "Запланировано", "В процессе", "Сделано!"],
      tasks: lang === "en" ? [
        { title: "Buy gifts for family", desc: "Select birthday gifts and order shipping.", priority: Priority.MEDIUM },
        { title: "Read design book", desc: "Finish reading chapter 4 of Refactoring UI book.", priority: Priority.LOW },
        { title: "Full workout", desc: "Strength workout in the gym + heart rate measurement on smart watch.", priority: Priority.MEDIUM },
        { title: "Order groceries for the week", desc: "Vegetables, fruits, cereals and clean water for the whole team.", priority: Priority.HIGH },
      ] : [
        { title: "Купить подарки семье", desc: "Выбрать сувениры на день рождения и заказать доставку.", priority: Priority.MEDIUM },
        { title: "Прочесть книгу по дизайну", desc: "Завершить чтение 4-й главы книги Рефракторинг UI.", priority: Priority.LOW },
        { title: "Полноценная тренировка", desc: "Силовая тренировка в зале + замер пульса на умных часах.", priority: Priority.MEDIUM },
        { title: "Заказать продукты на неделю", desc: "Овощи, фрукты, крупы и чистая вода на всю команду.", priority: Priority.HIGH },
      ]
    },
    {
      id: "ai-telegram-bot",
      icon: <Cpu className="w-6 h-6 text-amber-500" />,
      title: lang === "en" ? "AI Telegram Bot Development" : "Разработка AI Телеграм-бота",
      description: lang === "en"
        ? "Mini-project to launch a smart virtual assistant with Gemini neural network integration."
        : "Мини-проект по выпуску умного виртуального помощника с интеграцией нейросети Gemini.",
      columns: lang === "en"
        ? ["Specs", "Bot Dev", "Prompt Testing", "Deployment"]
        : ["Техзадание", "Разработка бота", "Тестирование подсказок", "Развертывание"],
      tasks: lang === "en" ? [
        { title: "Integrate Gemini API", desc: "Deploy server route /api/chat with prompt sending to the gemini-2.5 model.", priority: Priority.HIGH },
        { title: "Register bot in BotFather", desc: "Get secret token to connect webhook.", priority: Priority.MEDIUM },
        { title: "Add SQLite database", desc: "Sessions table and memorizing context of user dialogs.", priority: Priority.MEDIUM },
        { title: "Setup deployment on Vercel/Render", desc: "Link git repository for auto-build on merge to main branch.", priority: Priority.HIGH },
      ] : [
        { title: "Интегрировать Gemini API", desc: "Развернуть серверный роут /api/chat с отправкой промптов модели gemini-2.5.", priority: Priority.HIGH },
        { title: "Зарегистрировать бота в BotFather", desc: "Получить секретный токен для подключения вебхука.", priority: Priority.MEDIUM },
        { title: "Добавить базу данных SQLite", desc: "Таблица сессий и запоминание контекста диалогов пользователей.", priority: Priority.MEDIUM },
        { title: "Настроить деплой на Vercel/Render", desc: "Связать гит репозиторий для авто-сборки при мерже в ветку main.", priority: Priority.HIGH },
      ]
    }
  ];

  const handleApplyTemplate = async (tmpl: typeof templatesList[0]) => {
    if (!currentUser || seedingId) return;
    setSeedingId(tmpl.id);

    try {
      const boardId = Math.random().toString(36).substring(2, 15);
      // 1. Create Board
      const newBoard = {
        id: boardId,
        name: lang === "en" ? `Template: ${tmpl.title}` : `Шаблон: ${tmpl.title}`,
        ownerId: currentUser.uid,
        createdAt: Date.now(),
      };
      await firestore.set("boards", boardId, newBoard);

      // 2. Add owner to board members
      await firestore.set(`boards/${boardId}/members`, currentUser.uid, {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        email: currentUser.email,
        photoURL: currentUser.photoURL || "",
      });

      // 3. Add Columns
      const colIdsCreated: string[] = [];
      const colPromises = tmpl.columns.map(async (colName, i) => {
        const colId = Math.random().toString(36).substring(2, 15);
        colIdsCreated.push(colId);
        await firestore.set(`boards/${boardId}/columns`, colId, {
          id: colId,
          name: colName,
          order: i,
          sortMode: "manual"
        });
        return colId;
      });
      await Promise.all(colPromises);

      // 4. Seeding Tasks inside the created columns
      const taskPromises = tmpl.tasks.map(async (t, i) => {
        const cardId = Math.random().toString(36).substring(2, 15);
        // Distribute tasks across first two columns
        const colId = i < 2 ? colIdsCreated[0] : colIdsCreated[1];
        
        const cardData = {
          id: cardId,
          title: t.title,
          description: t.desc,
          priority: t.priority,
          assigneeId: currentUser.uid,
          tagIds: [],
          createdAt: Date.now() - (i * 3600000), // Stagger created dates
          columnId: colId,
          dueDate: new Date(Date.now() + (i * 86400000)).toISOString().split("T")[0], // Spread due dates
          subtasks: lang === "en" ? [
            { id: "s1", text: "Fill out checklist of developments", completed: i % 2 === 0 },
            { id: "s2", text: "Approve the final build", completed: false }
          ] : [
            { id: "s1", text: "Оформить чек-лист наработок", completed: i % 2 === 0 },
            { id: "s2", text: "Согласовать финальный билд", completed: false }
          ],
          comments: lang === "en" ? [
            { id: "c1", text: "Great start! Let's finish this task as soon as possible.", authorName: "Administrator", createdAt: Date.now() - 1800000 }
          ] : [
            { id: "c1", text: "Отличный старт! Давайте завершим эту задачу побыстрее.", authorName: "Администратор", createdAt: Date.now() - 1800000 }
          ]
        };
        await firestore.set(`boards/${boardId}/cards`, cardId, cardData);
      });
      await Promise.all(taskPromises);

      // Succeeded callback
      onBoardCreated(boardId);
    } catch (err) {
      console.error("Error seeding template:", err);
      alert(lang === "en" 
        ? "Failed to apply template: " + (err instanceof Error ? err.message : String(err))
        : "Не удалось применить шаблон: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeedingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-app overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
      <div>
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">{t.templates.layouts}</span>
        <h2 className="text-2xl font-black text-text-title tracking-tight mt-1">{t.templates.readyTemplates}</h2>
        <p className="text-xs text-text-secondary mt-1">{t.templates.oneClickReady}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templatesList.map((tmpl) => (
          <div 
            key={tmpl.id} 
            className="bg-bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-bg-app rounded-2xl border border-border-ui group-hover:scale-105 transition-transform duration-200">
                  {tmpl.icon}
                </span>
                <div>
                  <h3 className="text-base font-bold text-text-title">{tmpl.title}</h3>
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">{lang === "en" ? "Columns" : "Колонок"}: {tmpl.columns.length}</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{tmpl.description}</p>

              {/* Columns visualization preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">{lang === "en" ? "Structure Columns:" : "Колонки структуры:"}</span>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.columns.map((c, idx) => (
                    <span key={idx} className="text-[10px] font-semibold text-text-body bg-bg-app border border-border-ui px-2.5 py-1 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-ui/50 mt-6 flex items-center justify-between">
              <span className="text-[10px] text-text-secondary font-bold font-mono">{lang === "en" ? "Default tasks" : "Задач по умолчанию"}: {tmpl.tasks.length}</span>
              <button
                onClick={() => handleApplyTemplate(tmpl)}
                disabled={seedingId !== null}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                {seedingId === tmpl.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === "en" ? "Applying..." : "Применение..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.templates.useTemplate}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-50/10 dark:from-blue-950/15 dark:to-blue-950/5 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
            <Rocket className="w-4.5 h-4.5 text-blue-500" /> {t.templates.customTemplates}
          </h4>
          <p className="text-xs text-blue-900/70 dark:text-blue-300/60 leading-relaxed max-w-xl">
            {t.templates.customDesc}
          </p>
        </div>
        <button 
          onClick={() => setShowProModal(true)}
          className="px-5 py-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100/30 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl transition-all self-start md:self-auto uppercase tracking-wider cursor-pointer"
        >
          {t.templates.readAnnouncement}
        </button>
      </div>

      <AnimatePresence>
        {showProModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProModal(false)}
              className="absolute inset-0 bg-slate-900/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-black text-text-title mb-2">{t.templates.proSoon}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {t.templates.proDesc}
              </p>
              <button
                onClick={() => setShowProModal(false)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all"
              >
                {t.templates.gotIt}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
