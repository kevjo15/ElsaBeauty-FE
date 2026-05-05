import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ConversationReadListener = (conversationId: string) => void;

interface ChatStateContextValue {
  /** Unread message count per conversation ID. */
  unreadCounts: Record<string, number>;
  /**
   * Synchronously readable active conversation ID.
   * Use this in SignalR event handlers where a React state value may be stale.
   */
  getActiveConversationId: () => string | null;
  /** Called by useSignalRChat when a chat page mounts/unmounts. */
  setActiveConversation: (conversationId: string | null) => void;
  /** Called by useNotifications after the initial notification fetch to seed counts. */
  setInitialUnreadCounts: (counts: Record<string, number>) => void;
  /** Increment unread count when a new chat message arrives. */
  incrementUnread: (conversationId: string) => void;
  /**
   * Mark a conversation as read (sets count to 0) and notify all registered
   * listeners (e.g. useNotifications, to mark related notifications as read).
   */
  markConversationRead: (conversationId: string) => void;
  /**
   * Register a callback that fires whenever a conversation is marked as read.
   * Returns an unsubscribe function — call it in your useEffect cleanup.
   */
  subscribeToConversationRead: (listener: ConversationReadListener) => () => void;
}

const ChatStateContext = createContext<ChatStateContextValue | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const unreadCountsRef = useRef<Record<string, number>>({});

  // Ref is updated synchronously so SignalR event handlers always see the current
  // value, even before React has committed the corresponding state update.
  const activeConversationIdRef = useRef<string | null>(null);

  const listenersRef = useRef<Set<ConversationReadListener>>(new Set());

  const getActiveConversationId = useCallback(() => activeConversationIdRef.current, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId?.toLowerCase() ?? null;
  }, []);

  const setInitialUnreadCounts = useCallback((counts: Record<string, number>) => {
    // Normalize keys to lowercase and replace the entire map so stale
    // keys from a previous session or user switch are always cleared.
    const normalized = Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k.toLowerCase(), v])
    );
    setUnreadCounts((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(normalized);
      const sameKeys =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((k) => prev[k] === normalized[k]);
      return sameKeys ? prev : normalized;
    });
  }, []);

  unreadCountsRef.current = unreadCounts;

  const incrementUnread = useCallback((conversationId: string) => {
    const key = conversationId.toLowerCase();
    setUnreadCounts((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }));
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    const key = conversationId.toLowerCase();
    if ((unreadCountsRef.current[key] ?? 0) > 0) {
      setUnreadCounts((prev) => {
        return { ...prev, [key]: 0 };
      });
    }
    listenersRef.current.forEach((listener) => listener(conversationId));
  }, []);

  const subscribeToConversationRead = useCallback(
    (listener: ConversationReadListener) => {
      listenersRef.current.add(listener);
      return () => listenersRef.current.delete(listener);
    },
    []
  );

  // Memoize the context value. All methods are stable (useCallback with [] deps),
  // so this only recreates when unreadCounts changes — not on every render.
  const value = useMemo<ChatStateContextValue>(
    () => ({
      unreadCounts,
      getActiveConversationId,
      setActiveConversation,
      setInitialUnreadCounts,
      incrementUnread,
      markConversationRead,
      subscribeToConversationRead,
    }),
    // unreadCounts is the only reactive value; all methods are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unreadCounts]
  );

  return (
    <ChatStateContext.Provider value={value}>
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState(): ChatStateContextValue {
  const ctx = useContext(ChatStateContext);
  if (!ctx) throw new Error("useChatState must be used inside ChatStateProvider");
  return ctx;
}
