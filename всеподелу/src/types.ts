export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string;
  tagIds: string[];
  createdAt: number;
  columnId?: string;
  completed?: boolean;
  completedAt?: number;
  order?: number;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  subtasks?: { id: string; text: string; completed: boolean }[];
  comments?: { id: string; text: string; authorName: string; createdAt: number; authorPhoto?: string }[];
  isTrashed?: boolean;
  trashedAt?: number;
  boardId?: string;
  boardName?: string;
  columnName?: string;
}

export interface Column {
  id: string;
  name: string;
  cards: Card[];
  sortMode?: "manual" | "priority" | "date";
  order?: number;
  isTrashed?: boolean;
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
}
