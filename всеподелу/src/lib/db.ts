import { 
  CollectionReference,
  DocumentReference,
  Query
} from "firebase/firestore";
import { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    if (obj.constructor === Object || Object.getPrototypeOf(obj) === null) {
      const newObj: any = {};
      for (const key of Object.keys(obj)) {
        newObj[key] = cleanUndefined(obj[key]);
      }
      return newObj;
    }
  }
  return obj;
}

export const firestore = {
  async set(path: string, id: string, data: any) {
    try {
      await setDoc(doc(db, path, id), cleanUndefined(data));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`);
    }
  },
  
  async update(path: string, id: string, data: any) {
    try {
      await updateDoc(doc(db, path, id), cleanUndefined(data));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  },

  async delete(path: string, id: string) {
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  },

  onCollection(path: string, callback: (data: any[]) => void, constraints: any[] = []) {
    const q = query(collection(db, path), ...constraints);
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, path);
    });
  },

  onDoc(path: string, id: string, callback: (data: any) => void) {
    return onSnapshot(doc(db, path, id), (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, `${path}/${id}`);
    });
  }
};
