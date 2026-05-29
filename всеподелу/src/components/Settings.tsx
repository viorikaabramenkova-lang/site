import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings as SettingsIcon, 
  Trash2, 
  Check, 
  Globe, 
  Bell, 
  ShieldCheck, 
  Palette,
  Clock,
  X
} from "lucide-react";
import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateProfile 
} from "../lib/firebase";
import { firestore } from "../lib/db";
import { Board, Column } from "../types";
import ConfirmModal from "./ConfirmModal";

interface SettingsProps {
  currentUser: any;
  activeBoard: Board | undefined;
  boards: Board[];
  columns: Column[];
  onRefreshUser: () => void;
  cardPreset: "modern" | "flat" | "neon";
  setCardPreset: (preset: "modern" | "flat" | "neon") => void;
}

const translations = {
  ru: {
    parameters: "Параметры",
    title: "Настройки приложения",
    desc: "Настройте свой профиль, интерфейс и системные опции.",
    profile: "Личный профиль",
    appearance: "Внешний вид и Темы",
    system: "Система и Регион",
    notifications: "Оповещения",
    danger: "Опасная зона",
    displayName: "Отображаемое имя",
    avatarUrl: "URL-адрес аватара",
    email: "Email",
    phone: "Номер телефона",
    bio: "О себе (Био)",
    sticker: "Любимый стикер",
    preview: "Предпросмотр профиля",
    save: "Сохранить изменения",
    saving: "Сохранение...",
    saved: "Сохранено!",
    encryption: "Safe SSL шифрование активно",
    cardPreset: "Пресет карточек",
    presetModern: "Современный стиль",
    presetFlat: "Плоский минимализм",
    presetNeon: "Неоновые акценты",
    trashAuto: "Автоочистка корзины",
    trashDesc: "Удаленные карточки автоматически стираются через указанный срок.",
    language: "Язык интерфейса",
    timezone: "Часовой пояс",
    notifSound: "Звуковое уведомление выполнения",
    notifAssigned: "При назначении меня на задачу",
    notifOverdue: "За 1 день до просрочки",
    realtime: "Уведомления отправляются в реальном времени.",
    clearBoard: "Очистить все задачи на доске",
    clearDesc: "Удаление всех созданных задач в один клик. Восстановить задачи будет невозможно.",
    clearBoardSelect: "Выберите доску для полной очистки задач:",
    days: "дней",
    day1: "1 день",
    day3: "3 дня",
    day7: "7 дней",
    day14: "14 дней",
    day30: "30 дней",
    never: "Никогда",
    alertSaveFail: "Не удалось сохранить профиль.",
    alertClearConfirm: "Вы уверены, что хотите удалить ВСЕ задачи на текущей доске? Это действие необратимо.",
    alertClearConfirmTemplate: "Вы уверены, что хотите удалить ВСЕ задачи на доске \"{boardName}\"? Это действие абсолютно необратимо и сотрет все карточки.",
    alertClearSuccess: "Все задачи успешно удалены с этой доски!",
    alertClearFail: "Не удалось очистить доску.",
    clearBoardTitle: "Очистка задач на доске",
    clearBoardConfirm: "Да, удалить все задачи",
    clearing: "Очистка...",
    cleared: "Очищено!",
    clearError: "Ошибка!",
    cancel: "Отмена"
  },
  en: {
    parameters: "Parameters",
    title: "Application Settings",
    desc: "Customize your profile, interface, and system options.",
    profile: "Personal Profile",
    appearance: "Appearance & Themes",
    system: "System & Region",
    notifications: "Notifications",
    danger: "Danger Zone",
    displayName: "Display Name",
    avatarUrl: "Avatar URL",
    email: "Email",
    phone: "Phone Number",
    bio: "About Me (Bio)",
    sticker: "Favorite Sticker",
    preview: "Profile Preview",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Saved!",
    encryption: "Safe SSL encryption active",
    cardPreset: "Card Preset",
    presetModern: "Modern Layout",
    presetFlat: "Flat Minimal",
    presetNeon: "Neon Accents",
    trashAuto: "Auto-clear Trash",
    trashDesc: "Deleted cards are permanently erased after the specified period.",
    language: "Interface Language",
    timezone: "Time Zone",
    notifSound: "Task completion sound",
    notifAssigned: "When assigned to a task",
    notifOverdue: "1 day before overdue",
    realtime: "Notifications are sent in real-time.",
    clearBoard: "Clear all tasks on board",
    clearDesc: "Delete all created tasks in one click. Restoring tasks will be impossible.",
    clearBoardSelect: "Select board to fully clear tasks:",
    days: "days",
    day1: "1 day",
    day3: "3 days",
    day7: "7 days",
    day14: "14 days",
    day30: "30 days",
    never: "Never",
    alertSaveFail: "Failed to save profile.",
    alertClearConfirm: "Are you sure you want to delete ALL tasks on the current board? This action is irreversible.",
    alertClearConfirmTemplate: "Are you sure you want to delete ALL tasks on the board \"{boardName}\"? This action is absolutely irreversible and will erase all cards.",
    alertClearSuccess: "All tasks successfully deleted from this board!",
    alertClearFail: "Failed to clear the board.",
    clearBoardTitle: "Clear tasks on the board",
    clearBoardConfirm: "Yes, delete all tasks",
    clearing: "Clearing...",
    cleared: "Cleared!",
    clearError: "Error!",
    cancel: "Cancel"
  }
};

export default function Settings({ 
  currentUser, 
  activeBoard, 
  boards = [],
  columns, 
  onRefreshUser,
  cardPreset,
  setCardPreset
}: SettingsProps) {
  const [profileName, setProfileName] = useState(currentUser.displayName || currentUser.name || currentUser.email?.split("@")[0] || "User");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.photoURL || "");
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || "");
  const [userEmail, setUserEmail] = useState(currentUser.email || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [activeSticker, setActiveSticker] = useState(currentUser.sticker || "🦄");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notifSound, setNotifSound] = useState(true);
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifOverdue, setNotifOverdue] = useState(true);
  
  const storedLang = localStorage.getItem('appLanguage') || "ru";
  const [language, setLanguage] = useState(storedLang);
  const [timezone, setTimezone] = useState(() => localStorage.getItem('appTimezone') || "Europe/Moscow");

  const [selectedClearBoardId, setSelectedClearBoardId] = useState<string>(() => {
    return activeBoard?.id || (boards && boards.length > 0 ? boards[0].id : "");
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [clearError, setClearError] = useState(false);

  const [trashDays, setTrashDays] = useState(() => {
    return localStorage.getItem("trashAutoDeleteDays") || (activeBoard ? localStorage.getItem(`trashAutoDeleteDays_${activeBoard.id}`) : null) || "7";
  });

  const t = translations[language as keyof typeof translations] || translations.ru;

  useEffect(() => {
    async function loadUserProfile() {
      if (currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileName(data.name || currentUser.displayName || "");
            setAvatarUrl(data.photoURL || currentUser.photoURL || "");
            setUserEmail(data.email || currentUser.email || "");
            setPhoneNumber(data.phoneNumber || "");
            setBio(data.bio || "");
            setActiveSticker(data.sticker || "🦄");
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        }
      }
    }
    loadUserProfile();
  }, [currentUser]);

  useEffect(() => {
    setTrashDays(localStorage.getItem("trashAutoDeleteDays") || (activeBoard ? localStorage.getItem(`trashAutoDeleteDays_${activeBoard.id}`) : null) || "7");
  }, [activeBoard]);

  useEffect(() => {
    if (activeBoard?.id) {
      setSelectedClearBoardId(activeBoard.id);
    } else if (boards && boards.length > 0 && !selectedClearBoardId) {
      setSelectedClearBoardId(boards[0].id);
    }
  }, [activeBoard, boards]);

  const handleTrashDaysChange = (value: string) => {
    setTrashDays(value);
    localStorage.setItem("trashAutoDeleteDays", value);
    if (activeBoard) {
      localStorage.setItem(`trashAutoDeleteDays_${activeBoard.id}`, value);
    }
  };

  const handlePresetChange = (preset: "modern" | "flat" | "neon") => {
    setCardPreset(preset);
    localStorage.setItem("cardPreset", preset);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(currentUser, {
        displayName: profileName,
        photoURL: avatarUrl
      });
      await firestore.set("users", currentUser.uid, {
        id: currentUser.uid,
        name: profileName,
        email: userEmail,
        photoURL: avatarUrl,
        phoneNumber: phoneNumber,
        bio: bio,
        sticker: activeSticker
      });
      if (activeBoard) {
        await firestore.set(`boards/${activeBoard.id}/members`, currentUser.uid, {
          id: currentUser.uid,
          name: profileName,
          email: userEmail,
          photoURL: avatarUrl,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefreshUser();
    } catch (err) {
      console.error(err);
      alert(t.alertSaveFail);
    } finally {
      setIsSaving(false);
    }
  };

  const executeClearBoardTasks = async () => {
    if (!selectedClearBoardId) return;
    const targetBoard = boards.find(b => b.id === selectedClearBoardId);
    if (!targetBoard) return;

    setIsClearing(true);
    setClearSuccess(false);
    setClearError(false);

    try {
      const cardsRef = collection(db, `boards/${targetBoard.id}/cards`);
      const snapshot = await getDocs(cardsRef);
      const deletePromises = snapshot.docs.map(docSnap => firestore.delete(`boards/${targetBoard.id}/cards`, docSnap.id));
      await Promise.all(deletePromises);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setClearError(true);
      setTimeout(() => setClearError(false), 4000);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearBoardTasks = () => {
    if (!selectedClearBoardId) return;
    setIsConfirmModalOpen(true);
  };

  const getConfirmMessage = () => {
    if (!selectedClearBoardId) return "";
    const targetBoard = boards.find(b => b.id === selectedClearBoardId);
    if (!targetBoard) return "";
    return (t as any).alertClearConfirmTemplate
      ? (t as any).alertClearConfirmTemplate.replace("{boardName}", targetBoard.name)
      : t.alertClearConfirm.replace("текущей доске", `доске "${targetBoard.name}"`);
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLanguage(val);
    localStorage.setItem('appLanguage', val);
    window.dispatchEvent(new Event('languageChange'));
    if (currentUser?.uid) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { language: val }, { merge: true });
      } catch (err) {
        console.error("Error saving language to Firestore:", err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-app overflow-y-auto px-4 sm:px-8 py-8 space-y-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">{t.parameters}</span>
          <h2 className="text-3xl font-black text-text-title tracking-tight mt-3">{t.title}</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-lg">{t.desc}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Profile Settings card */}
            <div className="bg-bg-card border border-border-ui rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-black text-text-title flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-500" /> {t.profile}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.displayName}</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 px-4 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.email}</label>
                  <input 
                    type="email" 
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full h-11 px-4 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.phone}</label>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+7 999 000-00-00"
                    className="w-full h-11 px-4 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.avatarUrl}</label>
                  <input 
                    type="text" 
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full h-11 px-4 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.bio}</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="..."
                    rows={2}
                    className="w-full px-4 py-3 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title resize-none"
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">{t.sticker}</label>
                  <div className="flex flex-wrap gap-2">
                    {["🦄", "🔥", "🚀", "💡", "🎯", "🌟", "💻", "🍕", "🎸", "☕", "🎮"].map(s => (
                      <button
                        key={s}
                        onClick={() => setActiveSticker(s)}
                        className={`w-11 h-11 flex items-center justify-center text-xl rounded-xl border transition-all cursor-pointer ${activeSticker === s ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/30' : 'bg-bg-app border-border-ui hover:border-blue-300 shadow-sm'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Preview Block */}
              <div className="mt-8 flex items-center gap-5 bg-bg-app border border-border-ui p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-8xl">
                  {activeSticker}
                </div>
                <div className="relative">
                  <img 
                    src={avatarUrl || `https://i.pravatar.cc/96?u=${currentUser.uid}`} 
                    className="w-16 h-16 rounded-full border border-border-ui object-cover shrink-0 relative z-10 shadow-sm"
                    alt="Preview" 
                    onError={(e) => {
                      e.currentTarget.src = `https://i.pravatar.cc/96?u=${currentUser.uid}`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 z-20 bg-bg-card rounded-full text-base leading-none p-1 border border-border-ui shadow-sm">
                    {activeSticker}
                  </div>
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t.preview}</span>
                  <p className="text-base font-black text-text-title flex items-center gap-2 mt-0.5">
                    {profileName} 
                    {bio && <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">INFO</span>}
                  </p>
                  <div className="text-[11px] text-text-secondary flex flex-col mt-0.5 font-medium space-y-0.5">
                    {userEmail && <span>{userEmail}</span>}
                    {phoneNumber && <span>{phoneNumber}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-ui/50 mt-8 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  {t.encryption}
                </span>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  {isSaving ? t.saving : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t.saved}
                    </>
                  ) : (
                    t.save
                  )}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
                <div className="space-y-2">
                  <h4 className="text-base font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-500" /> {t.danger}
                  </h4>
                  <p className="text-xs text-red-900/80 dark:text-red-300/80 leading-relaxed max-w-xl font-medium">
                    {t.clearDesc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-red-200/40 dark:border-rose-900/40 flex flex-col sm:flex-row items-end sm:items-center gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-bold text-red-900/70 dark:text-red-300/70 uppercase tracking-wider mb-2">
                    {(t as any).clearBoardSelect || "Выберите доску для полной очистки:"}
                  </label>
                  <select
                    value={selectedClearBoardId}
                    onChange={(e) => setSelectedClearBoardId(e.target.value)}
                    className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-red-200 dark:border-rose-900/60 rounded-xl outline-none focus:border-red-500 transition-all text-xs font-bold text-text-title cursor-pointer"
                  >
                    <option value="" disabled>{storedLang === "en" ? "-- Choose Board --" : "-- Выберите доску --"}</option>
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleClearBoardTasks}
                  disabled={!selectedClearBoardId || isClearing}
                  className="px-6 py-3 h-11 bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-rose-950/40 dark:disabled:text-red-800 text-white font-bold text-xs rounded-xl transition-all w-full sm:w-auto shadow-md cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 self-end shrink-0 min-w-[210px]"
                >
                  {isClearing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>{t.clearing || "Очистка..."}</span>
                    </>
                  ) : clearSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.cleared || "Очищено!"}</span>
                    </>
                  ) : clearError ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>{t.clearError || "Ошибка!"}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{t.clearBoard}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isConfirmModalOpen && (
              <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeClearBoardTasks}
                title={t.clearBoardTitle || "Очистка задач на доске"}
                message={getConfirmMessage()}
                confirmText={t.clearBoardConfirm || "Да, удалить все задачи"}
                cancelText={t.cancel || "Отмена"}
                variant="danger"
              />
            )}
            
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* System Preferences */}
            <div className="bg-bg-card border border-border-ui rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-black text-text-title flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-blue-500" /> {t.system}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.language}</label>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="w-full h-11 px-3 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title cursor-pointer"
                  >
                    <option value="ru">Русский (Russian)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {t.timezone}</label>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      localStorage.setItem('appTimezone', e.target.value);
                    }}
                    className="w-full h-11 px-3 bg-bg-app border border-border-ui rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold text-text-title cursor-pointer"
                  >
                    <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                    <option value="Europe/Moscow">Москва (UTC+3)</option>
                    <option value="Europe/Samara">Самара (UTC+4)</option>
                    <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                    <option value="Asia/Omsk">Омск (UTC+6)</option>
                    <option value="Asia/Krasnoyarsk">Красноярск (UTC+7)</option>
                    <option value="Asia/Irkutsk">Иркутск (UTC+8)</option>
                    <option value="Asia/Yakutsk">Якутск (UTC+9)</option>
                    <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                    <option value="Asia/Magadan">Магадан (UTC+11)</option>
                    <option value="Asia/Kamchatka">Камчатка (UTC+12)</option>
                    <option disabled>───────────────</option>
                    <option value="Europe/London">London (UTC+0)</option>
                    <option value="America/New_York">New York (UTC-5)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-bg-card border border-border-ui rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-black text-text-title flex items-center gap-2 mb-6">
                <Palette className="w-5 h-5 text-blue-500" /> {t.appearance}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.cardPreset}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "modern", label: (t as any).presetModern || "Modern Layout" },
                      { id: "flat", label: (t as any).presetFlat || "Flat Minimal" },
                      { id: "neon", label: (t as any).presetNeon || "Neon Accents" }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetChange(preset.id as any)}
                        className={`py-3 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          cardPreset === preset.id 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm" 
                            : "border-border-ui text-text-secondary hover:text-text-title bg-bg-app hover:border-blue-300"
                        }`}
                      >
                        {preset.label}
                        {cardPreset === preset.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t.trashAuto}</label>
                  <div className="grid grid-cols-3 gap-2 pb-2">
                    {[
                      { id: "1", label: t.day1 },
                      { id: "3", label: t.day3 },
                      { id: "7", label: t.day7 },
                      { id: "14", label: t.day14 },
                      { id: "30", label: t.day30 },
                      { id: "never", label: t.never }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleTrashDaysChange(option.id)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer truncate ${
                          trashDays === option.id
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                            : "border-border-ui text-text-secondary hover:text-text-title bg-bg-app hover:border-blue-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                    {t.trashDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-bg-card border border-border-ui rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-black text-text-title flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-blue-500" /> {t.notifications}
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group bg-bg-app p-3 rounded-xl border border-border-ui hover:border-blue-300 transition-all">
                  <span className="text-xs font-bold text-text-body">{t.notifSound}</span>
                  <input 
                    type="checkbox" 
                    checked={notifSound} 
                    onChange={() => setNotifSound(!notifSound)} 
                    className="w-4 h-4 rounded text-blue-500 border-border-ui cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group bg-bg-app p-3 rounded-xl border border-border-ui hover:border-blue-300 transition-all">
                  <span className="text-xs font-bold text-text-body">{t.notifAssigned}</span>
                  <input 
                    type="checkbox" 
                    checked={notifAssigned} 
                    onChange={() => setNotifAssigned(!notifAssigned)} 
                    className="w-4 h-4 rounded text-blue-500 border-border-ui cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group bg-bg-app p-3 rounded-xl border border-border-ui hover:border-blue-300 transition-all">
                  <span className="text-xs font-bold text-text-body">{t.notifOverdue}</span>
                  <input 
                    type="checkbox" 
                    checked={notifOverdue} 
                    onChange={() => setNotifOverdue(!notifOverdue)} 
                    className="w-4 h-4 rounded text-blue-500 border-border-ui cursor-pointer" 
                  />
                </label>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

