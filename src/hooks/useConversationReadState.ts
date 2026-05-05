import { useCallback, useEffect, useRef } from "react";
import { markConversationAsReadHttp } from "@/services/api/chatAPI";
import type { ChatMessage } from "@/services/api/types";

const hasReadAt = (value?: string) => typeof value === "string" && value.trim().length > 0;
const normalizeReadAt = (value?: string) => (hasReadAt(value) ? value!.trim() : undefined);
const normalizeMessageId = (value?: string) => (value ?? "").trim().toLowerCase();
const sameUserId = (left?: string, right?: string) =>
  (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();

interface ConversationReadBatchPayload {
  MessageIds?: string[];
  messageIds?: string[];
  ReadAt?: string;
  readAt?: string;
}

interface UseConversationReadStateParams {
  conversationId?: string;
  currentUserId?: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useConversationReadState({
  conversationId,
  currentUserId,
  messages,
  setMessages,
}: UseConversationReadStateParams) {
  const messagesRef = useRef<ChatMessage[]>(messages);
  const currentUserIdRef = useRef<string | undefined>(currentUserId);
  const pendingReadUpdatesRef = useRef<Map<string, string | undefined>>(new Map());
  const readFlushFrameRef = useRef<number | null>(null);
  const bulkReadFallbackInFlightRef = useRef(false);
  const suppressedBulkReadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    return () => {
      if (readFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(readFlushFrameRef.current);
      }
    };
  }, []);

  const requestBulkReadFallback = useCallback(() => {
    if (!conversationId || bulkReadFallbackInFlightRef.current) return;
    bulkReadFallbackInFlightRef.current = true;
    void markConversationAsReadHttp(conversationId).finally(() => {
      bulkReadFallbackInFlightRef.current = false;
    });
  }, [conversationId]);

  const flushPendingReadUpdates = useCallback(() => {
    readFlushFrameRef.current = null;
    const queued = new Map(pendingReadUpdatesRef.current);
    pendingReadUpdatesRef.current.clear();

    if (queued.size === 0) return;

    setMessages((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        const messageId = normalizeMessageId(m.id);
        if (!messageId || !queued.has(messageId)) return m;
        const nextReadAt = normalizeReadAt(queued.get(messageId));
        if (normalizeReadAt(m.readAt) === nextReadAt) return m;
        changed = true;
        return { ...m, readAt: nextReadAt };
      });
      if (changed) {
        messagesRef.current = next;
      }
      return changed ? next : prev;
    });
  }, [setMessages]);

  const queueReadUpdate = useCallback(
    (messageId: string, readAtTime?: string) => {
      const normalizedMessageId = normalizeMessageId(messageId);
      if (!normalizedMessageId) return;

      if (suppressedBulkReadIdsRef.current.has(normalizedMessageId)) {
        suppressedBulkReadIdsRef.current.delete(normalizedMessageId);
        return;
      }

      pendingReadUpdatesRef.current.set(normalizedMessageId, readAtTime);
      if (readFlushFrameRef.current !== null) return;
      readFlushFrameRef.current = window.requestAnimationFrame(flushPendingReadUpdates);
    },
    [flushPendingReadUpdates]
  );

  const applyConversationReadBatch = useCallback(
    (payload: ConversationReadBatchPayload) => {
      const messageIds = payload.MessageIds ?? payload.messageIds ?? [];
      const readAtTime =
        normalizeReadAt(payload.ReadAt ?? payload.readAt) ?? new Date().toISOString();

      messageIds.forEach((messageId) => {
        queueReadUpdate(messageId, readAtTime);
      });
    },
    [queueReadUpdate]
  );

  const markConversationAsRead = useCallback(() => {
    const viewerId = currentUserIdRef.current;
    if (!viewerId) return;

    const unreadMessages = messagesRef.current.filter((m) => {
      const isOtherUsersMessage =
        !!m.senderId && !sameUserId(m.senderId, viewerId);
      return isOtherUsersMessage && !hasReadAt(m.readAt);
    });

    if (unreadMessages.length === 0) return;

    const nowIso = new Date().toISOString();
    const unreadIds = new Set(
      unreadMessages
        .map((m) => normalizeMessageId(m.id))
        .filter((id): id is string => Boolean(id))
    );

    setMessages((prev) => {
      const next = prev.map((m) => {
        const isOtherUsersMessage =
          !!m.senderId && !sameUserId(m.senderId, viewerId);
        if (!isOtherUsersMessage || hasReadAt(m.readAt)) return m;
        return { ...m, readAt: nowIso };
      });
      messagesRef.current = next;
      return next;
    });

    unreadIds.forEach((id) => suppressedBulkReadIdsRef.current.add(id));
    requestBulkReadFallback();
  }, [requestBulkReadFallback, setMessages]);

  return {
    currentUserIdRef,
    requestBulkReadFallback,
    queueReadUpdate,
    applyConversationReadBatch,
    markConversationAsRead,
  };
}
