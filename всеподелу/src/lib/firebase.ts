import { initializeApp } from "firebase/app";
import * as realAuth from "firebase/auth";
import * as realFirestore from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Detect if running locally (file:// protocol) or if Firebase is not configured properly
export const isLocal = 
  typeof window !== "undefined" && 
  (window.location.protocol === "file:" || 
   !firebaseConfig || 
   !firebaseConfig.apiKey || 
   window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" || 
   localStorage.getItem("forceOffline") === "true");

console.log("All To The Point Mode:", isLocal ? "Local Offline-First Mode 📌" : "Cloud Sync Mode ☁️");

// Initialize real Firebase only if we are in cloud sync mode
let app: any = null;
let rawAuth: any = null;
let rawDb: any = null;

if (!isLocal) {
  try {
    app = initializeApp(firebaseConfig);
    rawAuth = realAuth.getAuth(app);
    rawDb = realFirestore.getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    // Quick async check to verify connectivity
    realFirestore.getDocFromServer(realFirestore.doc(rawDb, "test", "connection")).catch(() => {
      console.warn("Real Firebase check timed out, continuing in Cloud mode anyway");
    });
  } catch (err) {
    console.error("Failed to initialize remote Firebase - falling back to Local mode", err);
  }
}

// ---------------- LOCAL DATABASE STORAGE ENGINE ----------------
function getLocalDoc(path: string): any {
  if (typeof localStorage === "undefined") return null;
  const store = JSON.parse(localStorage.getItem("_local_firestore") || "{}");
  return store[path] || null;
}

function setLocalDoc(path: string, data: any, merge: boolean = false) {
  if (typeof localStorage === "undefined") return;
  const store = JSON.parse(localStorage.getItem("_local_firestore") || "{}");
  if (merge && store[path]) {
    store[path] = { ...store[path], ...data };
  } else {
    store[path] = data;
  }
  localStorage.setItem("_local_firestore", JSON.stringify(store));
  triggerPathListeners(path);
}

function deleteLocalDoc(path: string) {
  if (typeof localStorage === "undefined") return;
  const store = JSON.parse(localStorage.getItem("_local_firestore") || "{}");
  delete store[path];
  
  // Also clean up any nested path keys (children subcollections)
  const prefix = path + "/";
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) {
      delete store[key];
    }
  }
  
  localStorage.setItem("_local_firestore", JSON.stringify(store));
  triggerPathListeners(path);
}

function getLocalCollection(colPath: string): any[] {
  if (typeof localStorage === "undefined") return [];
  const store = JSON.parse(localStorage.getItem("_local_firestore") || "{}");
  const result: any[] = [];
  const prefix = colPath.endsWith("/") ? colPath : colPath + "/";
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) {
      const remaining = key.substring(prefix.length);
      if (!remaining.includes("/")) {
        result.push({ id: remaining, ...store[key] });
      }
    }
  }
  return result;
}

// ---------------- LOCAL REACTIVE EVENT EMITTER ----------------
type Listener = {
  path: string;
  isCollection: boolean;
  callback: (snapshot: any) => void;
};

const listeners = new Set<Listener>();

let pendingTriggerPaths = new Set<string>();
let triggerTimeout: any = null;

function triggerPathListeners(path: string) {
  pendingTriggerPaths.add(path);
  if (triggerTimeout) return;
  
  triggerTimeout = setTimeout(() => {
    triggerTimeout = null;
    const pathsToProcess = Array.from(pendingTriggerPaths);
    pendingTriggerPaths.clear();
    
    // We want to trigger each unique listener only once per batch
    const processedListeners = new Set<any>();
    
    for (const p of pathsToProcess) {
      const parts = p.split("/");
      const colPath = parts.slice(0, parts.length - 1).join("/");
      const docId = parts[parts.length - 1];
      
      for (const listener of listeners) {
        if (processedListeners.has(listener)) continue;
        
        if (listener.isCollection && listener.path === colPath) {
          const data = getLocalCollection(colPath);
          listener.callback({
            docs: data.map(doc => ({
              id: doc.id,
              data: () => doc,
              exists: () => true
            }))
          });
          processedListeners.add(listener);
        } else if (!listener.isCollection && listener.path === p) {
          const docData = getLocalDoc(p);
          listener.callback({
            id: docId,
            exists: () => docData !== null,
            data: () => docData
          });
          processedListeners.add(listener);
        }
      }
    }
  }, 0);
}

// ---------------- SEED CHANNELS FOR TRIAL ----------------
export function seedDefaultBoardsIfClean() {
  if (typeof localStorage === "undefined") return;
  const store = JSON.parse(localStorage.getItem("_local_firestore") || "{}");
  const hasBoards = Object.keys(store).some(key => key.startsWith("boards/"));
  if (!hasBoards) {
    console.log("Seeding default interactive local board...");
    const boardId = "default-board-1";
    
    // Seed board document
    store[`boards/${boardId}`] = {
      id: boardId,
      name: "All To The Point (Scrum Template)",
      ownerId: "local_guest_user",
      createdAt: Date.now()
    };
    
    // Seed members
    store[`boards/${boardId}/members/local_guest_user`] = {
      id: "local_guest_user",
      name: "Guest Designer",
      email: "guest@example.com",
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=guest"
    };
    
    // Seed columns
    const columns = [
      { id: "col-todo", name: "To Do", order: 0, sortMode: "manual" },
      { id: "col-in-progress", name: "In Progress", order: 1, sortMode: "manual" },
      { id: "col-done", name: "Done", order: 2, sortMode: "manual" }
    ];
    
    columns.forEach(col => {
      store[`boards/${boardId}/columns/${col.id}`] = col;
    });
    
    // Seed tags
    const tags = [
      { id: "tag-feature", name: "Feature", color: "#3b82f6" },
      { id: "tag-bug", name: "Bug", color: "#ef4444" },
      { id: "tag-documentation", name: "Docs", color: "#10b981" }
    ];
    
    tags.forEach(tag => {
      store[`boards/${boardId}/tags/${tag.id}`] = tag;
    });

    // Seed cards
    const cards = [
      {
        id: "card-1",
        title: "Welcome to All To The Point! 🎉",
        description: "This is a local interactive workspace. Since you are running locally directly via the index.html file, all your changes are stored securely inside your browser's Local Storage.",
        columnId: "col-todo",
        priority: "medium",
        tagIds: ["tag-feature"],
        assigneeIds: ["local_guest_user"],
        checklist: [
          { id: "chk-1", text: "Create a new task", completed: false },
          { id: "chk-2", text: "Move this card to In Progress", completed: false }
        ],
        comments: [
          { id: "c-1", text: "Feel free to check/uncheck checklists and add deadlines!", authorId: "local_guest_user", authorName: "Guest Designer", createdAt: Date.now() }
        ],
        createdAt: Date.now() - 3600000,
        isTrashed: false
      },
      {
        id: "card-2",
        title: "Drag and drop cards across columns",
        description: "You can drag and drop cards sideways to change board status, or click into them to view high priority tags, task history, and add project logs.",
        columnId: "col-in-progress",
        priority: "low",
        tagIds: ["tag-documentation"],
        assigneeIds: [],
        checklist: [],
        comments: [],
        createdAt: Date.now() - 7200000,
        isTrashed: false
      }
    ];
    
    cards.forEach(card => {
      store[`boards/${boardId}/cards/${card.id}`] = card;
    });
    
    localStorage.setItem("_local_firestore", JSON.stringify(store));
  }
}

// ---------------- EXPORTS & INTERFACE WRAPPERS ----------------

// Mock or Real objects
export const auth = isLocal ? {
  currentUser: null as any,
  signOut() {
    localStorage.removeItem("_local_guest_user");
    window.location.reload();
  }
} : rawAuth;

export const db = isLocal ? {
  isMock: true
} : rawDb;

export const googleProvider = new realAuth.GoogleAuthProvider();

export async function signInWithGoogle() {
  if (isLocal) {
    const guestUser = {
      uid: "local_guest_user",
      displayName: "Guest User",
      email: "guest@example.com",
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
      isAnonymous: true
    };
    localStorage.setItem("_local_guest_user", JSON.stringify(guestUser));
    seedDefaultBoardsIfClean();
    window.location.reload();
    return guestUser;
  } else {
    const result = await realAuth.signInWithPopup(rawAuth, googleProvider);
    return result.user;
  }
}

// ---------------- AUTHENTICATION WRAPPERS ----------------
export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  if (isLocal) {
    let guestUser: any = null;
    const stored = localStorage.getItem("_local_guest_user");
    if (stored) {
      guestUser = JSON.parse(stored);
    } else {
      // Auto-login as guest on local file launch to bypass Google Popup blocks
      guestUser = {
        uid: "local_guest_user",
        displayName: "Guest Designer",
        email: "guest@example.com",
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
        isAnonymous: true
      };
      localStorage.setItem("_local_guest_user", JSON.stringify(guestUser));
    }
    
    // Seed database if clean
    seedDefaultBoardsIfClean();

    // Authenticate the user details as active profile
    if (authInstance) {
      authInstance.currentUser = guestUser;
    }
    
    setTimeout(() => {
      callback(guestUser);
    }, 0);
    
    return () => {};
  } else {
    return realAuth.onAuthStateChanged(authInstance, callback);
  }
}

export async function updateProfile(user: any, profile: { displayName?: string, photoURL?: string }) {
  if (isLocal) {
    const stored = localStorage.getItem("_local_guest_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (profile.displayName !== undefined) u.displayName = profile.displayName;
      if (profile.photoURL !== undefined) u.photoURL = profile.photoURL;
      localStorage.setItem("_local_guest_user", JSON.stringify(u));
      
      // Update details in firestore database
      setLocalDoc(`users/${u.uid}`, {
        id: u.uid,
        name: u.displayName,
        email: u.email,
        photoURL: u.photoURL
      }, true);
      
      if (auth.currentUser) {
        auth.currentUser.displayName = u.displayName;
        auth.currentUser.photoURL = u.photoURL;
      }
    }
  } else {
    await realAuth.updateProfile(user, profile);
  }
}

// ---------------- FIRESTORE WRAPPERS ----------------
export function collection(dbRef: any, ...pathSegments: string[]) {
  if (isLocal) {
    const fullPath = pathSegments.join("/");
    return { path: fullPath, isCollection: true };
  } else {
    return (realFirestore.collection as any)(dbRef, ...pathSegments);
  }
}

export function doc(dbRef: any, firstSegment?: any, ...pathSegments: string[]) {
  if (isLocal) {
    let fullPath = "";
    if (firstSegment && typeof firstSegment === "object" && firstSegment.path) {
      fullPath = firstSegment.path;
      if (pathSegments.length > 0) {
        fullPath += "/" + pathSegments.join("/");
      } else {
        fullPath += "/" + Math.random().toString(36).substring(2, 15);
      }
    } else if (firstSegment !== undefined) {
      fullPath = String(firstSegment);
      if (pathSegments.length > 0) {
        fullPath += "/" + pathSegments.join("/");
      }
    } else {
      // Single argument call, collection reference passed as dbRef
      if (dbRef && typeof dbRef === "object" && dbRef.path) {
        fullPath = dbRef.path + "/" + Math.random().toString(36).substring(2, 15);
      } else {
        fullPath = "temp/" + Math.random().toString(36).substring(2, 15);
      }
    }
    const parts = fullPath.split("/");
    return { 
      path: fullPath, 
      isCollection: false,
      id: parts[parts.length - 1]
    };
  } else {
    // console.log("DEBUG: Cloud doc call", { dbRef, firstSegment, pathSegments });
    if (firstSegment === undefined) {
      if (!dbRef) {
        console.error("DEBUG: doc called with empty dbRef!");
        throw new Error("Function doc() cannot be called with an empty path.");
      }
      return (realFirestore.doc as any)(dbRef);
    }
    return (realFirestore.doc as any)(dbRef, firstSegment, ...pathSegments);
  }
}

export function query(ref: any, ...constraints: any[]) {
  if (isLocal) {
    return ref;
  } else {
    return realFirestore.query(ref, ...constraints);
  }
}

export function where(field: string, op: string, val: any) {
  if (isLocal) {
    return { type: "where", field, op, val };
  } else {
    return realFirestore.where(field, op as any, val);
  }
}

export function orderBy(field: string, direction: string = "asc") {
  if (isLocal) {
    return { type: "orderBy", field, direction };
  } else {
    return realFirestore.orderBy(field, direction as any);
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  if (isLocal) {
    setLocalDoc(docRef.path, data, !!(options && options.merge));
  } else {
    await realFirestore.setDoc(docRef, data, options);
  }
}

export async function updateDoc(docRef: any, data: any) {
  if (isLocal) {
    setLocalDoc(docRef.path, data, true);
  } else {
    await realFirestore.updateDoc(docRef, data);
  }
}

export async function deleteDoc(docRef: any) {
  if (isLocal) {
    deleteLocalDoc(docRef.path);
  } else {
    await realFirestore.deleteDoc(docRef);
  }
}

export async function getDoc(docRef: any) {
  if (isLocal) {
    const data = getLocalDoc(docRef.path);
    const parts = docRef.path.split("/");
    return {
      id: parts[parts.length - 1],
      exists: () => data !== null,
      data: () => data
    };
  } else {
    return await realFirestore.getDoc(docRef);
  }
}

export async function getDocs(queryRef: any) {
  if (isLocal) {
    const data = getLocalCollection(queryRef.path);
    return {
      docs: data.map(doc => ({
        id: doc.id,
        data: () => doc,
        exists: () => true
      }))
    };
  } else {
    return await realFirestore.getDocs(queryRef);
  }
}

export function onSnapshot(ref: any, callback: any, errorCallback?: any) {
  if (isLocal) {
    const listenerProps = {
      path: ref.path,
      isCollection: ref.isCollection,
      callback
    };
    listeners.add(listenerProps);
    
    // First trigger immediately with current cached dataset
    if (ref.isCollection) {
      const data = getLocalCollection(ref.path);
      setTimeout(() => {
        callback({
          docs: data.map(doc => ({
            id: doc.id,
            data: () => doc,
            exists: () => true
          }))
        });
      }, 0);
    } else {
      const docData = getLocalDoc(ref.path);
      const parts = ref.path.split("/");
      setTimeout(() => {
        callback({
          id: parts[parts.length - 1],
          exists: () => docData !== null,
          data: () => docData
        });
      }, 0);
    }
    
    return () => {
      listeners.delete(listenerProps);
    };
  } else {
    return realFirestore.onSnapshot(ref, callback, errorCallback);
  }
}
