import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  limit,
  startAfter,
  getDoc,
  updateDoc,
  type DocumentSnapshot,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatSession {
  id?: string
  userId: string
  websiteUrl: string
  websiteTitle: string
  messages: ChatMessage[]
  language: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  chunks?: string[]
  fullContent?: string
}

export interface ChatEntry {
  id?: string
  userId: string
  websiteUrl: string
  question: string
  answer: string
  language: string
  timestamp: Timestamp | Date
}

export interface Website {
  id?: string
  userId: string
  url: string
  processedAt: Timestamp | Date
  status: "processing" | "ready" | "error"
}

function getDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to environment variables.")
  }
  return db
}

export async function createChatSession(session: Omit<ChatSession, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const firestore = getDb()
  const now = Timestamp.now()

  // Only store essential data, not large content
  const sessionData = {
    userId: session.userId,
    websiteUrl: session.websiteUrl,
    websiteTitle: session.websiteTitle,
    messages: session.messages,
    language: session.language,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = await addDoc(collection(firestore, "chat_sessions"), sessionData)
  return docRef.id
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const firestore = getDb()
  const docRef = doc(firestore, "chat_sessions", sessionId)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as ChatSession
}

export async function updateChatSession(sessionId: string, messages: ChatMessage[]): Promise<void> {
  const firestore = getDb()
  const docRef = doc(firestore, "chat_sessions", sessionId)
  await updateDoc(docRef, {
    messages,
    updatedAt: Timestamp.now(),
  })
}

export async function getChatSessions(
  userId: string,
  limitCount = 50,
  lastDoc?: DocumentSnapshot,
): Promise<{ sessions: ChatSession[]; lastDoc: DocumentSnapshot | null }> {
  const firestore = getDb()

  let q = query(
    collection(firestore, "chat_sessions"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
    limit(limitCount),
  )

  if (lastDoc) {
    q = query(
      collection(firestore, "chat_sessions"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      startAfter(lastDoc),
      limit(limitCount),
    )
  }

  const snapshot = await getDocs(q)
  const sessions: ChatSession[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as ChatSession,
  )

  const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return { sessions, lastDoc: newLastDoc }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const firestore = getDb()
  await deleteDoc(doc(firestore, "chat_sessions", sessionId))
}

export async function deleteAllChatSessions(userId: string): Promise<void> {
  const firestore = getDb()
  const q = query(collection(firestore, "chat_sessions"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(firestore, "chat_sessions", d.id)))
  await Promise.all(deletePromises)
}

// Legacy functions for backward compatibility
export async function addChatHistory(entry: Omit<ChatEntry, "id" | "timestamp">): Promise<string> {
  const firestore = getDb()
  const docRef = await addDoc(collection(firestore, "chat_history"), {
    ...entry,
    timestamp: Timestamp.now(),
  })
  return docRef.id
}

export async function getChatHistory(
  userId: string,
  limitCount = 50,
  lastDoc?: DocumentSnapshot,
): Promise<{ entries: ChatEntry[]; lastDoc: DocumentSnapshot | null }> {
  const firestore = getDb()

  let q = query(
    collection(firestore, "chat_history"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(limitCount),
  )

  if (lastDoc) {
    q = query(
      collection(firestore, "chat_history"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      startAfter(lastDoc),
      limit(limitCount),
    )
  }

  const snapshot = await getDocs(q)
  const entries: ChatEntry[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as ChatEntry,
  )

  const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return { entries, lastDoc: newLastDoc }
}

export async function deleteAllChatHistory(userId: string): Promise<void> {
  const firestore = getDb()
  const q = query(collection(firestore, "chat_history"), where("userId", "==", userId))

  const snapshot = await getDocs(q)
  const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(firestore, "chat_history", d.id)))
  await Promise.all(deletePromises)
}

export async function addProcessedWebsite(website: Omit<Website, "id" | "processedAt">): Promise<string> {
  const firestore = getDb()
  const docRef = await addDoc(collection(firestore, "websites"), {
    ...website,
    processedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getProcessedWebsites(userId: string): Promise<Website[]> {
  const firestore = getDb()
  const q = query(collection(firestore, "websites"), where("userId", "==", userId), orderBy("processedAt", "desc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Website,
  )
}
