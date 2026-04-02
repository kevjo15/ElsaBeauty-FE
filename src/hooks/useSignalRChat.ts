import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { toast } from "sonner";
import {
  fetchConversationMessages,
  sendMessageHttp,
  toChatMessage,
} from "@/services/api/chatAPI";
import type { BookingChatMeta, ChatMessage } from "@/services/api/types";
import {
  requestNotificationPermission,
  showNotification,
  playNotificationSound,
} from "@/utils/notifications";
import { useSignalR } from "@/contexts/SignalRContext";
import { useChatState } from "@/contexts/ChatStateContext";
import { useConversationReadState } from "@/hooks/useConversationReadState";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";
const normalizeMessageId = (value?: string) => (value ?? "").trim().toLowerCase();
const sameUserId = (left?: string, right?: string) =>
  (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();

interface UseSignalRChatOptions {
  conversationId?: string;
  currentUserId?: string;
  bookingId?: string;
  bookingMeta?: BookingChatMeta;
}

interface UseSignalRChatResult {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  markConversationAsRead: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  isOtherUserTyping: boolean;
  status: ConnectionStatus;
  isChatOpen: boolean;
  isLoadingHistory: boolean;
  error?: string;
}

export function useSignalRChat({
  conversationId,
  currentUserId,
  bookingId,
  bookingMeta,
}: UseSignalRChatOptions): UseSignalRChatResult {
  const { chatHub, chatStatus } = useSignalR();
  const chatState = useChatState();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string>();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  const isChatOpen = useMemo(() => {
    if (typeof bookingMeta?.isChatOpen === "boolean") return bookingMeta.isChatOpen;
    const statusText = bookingMeta?.status?.toLowerCase() ?? "";
    if (statusText.includes("cancel")) return false;
    if (!bookingMeta?.endTime) return true;
    const graceMs = 24 * 60 * 60 * 1000;
    return Date.now() <= new Date(bookingMeta.endTime).getTime() + graceMs;
  }, [bookingMeta?.endTime, bookingMeta?.isChatOpen, bookingMeta?.status]);

  // De-duplicate and sort messages
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const merged = [...prev];
      let found = false;

      if (incoming.id) {
        const incomingId = normalizeMessageId(incoming.id);
        const idx = merged.findIndex((m) => normalizeMessageId(m.id) === incomingId);
        if (idx !== -1) { merged[idx] = incoming; found = true; }
      }

      if (!found) {
        const idx = merged.findIndex(
          (m) =>
            (!m.id || !incoming.id) &&
            m.senderId === incoming.senderId &&
            m.content === incoming.content &&
            Math.abs(new Date(m.sentAt).getTime() - new Date(incoming.sentAt).getTime()) < 10000
        );
        if (idx !== -1) { merged[idx] = incoming; found = true; }
      }

      if (!found) merged.push(incoming);

      return merged.sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    });
  }, []);

  const {
    currentUserIdRef,
    requestBulkReadFallback,
    queueReadUpdate,
    applyConversationReadBatch,
    markConversationAsRead,
  } = useConversationReadState({
    conversationId,
    currentUserId,
    messages,
    setMessages,
  });

  // ── Track active conversation so useNotifications skips incrementing ─────────
  // setActiveConversation only writes to a mutable ref (no React state, no re-renders),
  // so it's safe to call synchronously during render — this eliminates the brief window
  // between mount and useEffect where getActiveConversationId() would return null.
  chatState.setActiveConversation(conversationId ?? null);
  useEffect(() => {
    // Cleanup only: clear the ref when this chat unmounts.
    return () => chatState.setActiveConversation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load chat history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoadingHistory(true);
      setMessages([]);
      try {
        const history = await fetchConversationMessages(conversationId);
        if (!cancelled) {
          setMessages(
            (history ?? []).sort(
              (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            )
          );
        }
      } catch {
        if (!cancelled) setError("Could not load chat history");
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [conversationId]);

  // ── Join / leave conversation group ─────────────────────────────────────────
  // Runs when the hub becomes available OR when the connection is restored after
  // a reconnect (chatStatus changes to "connected").
  useEffect(() => {
    if (!conversationId || !chatHub || chatStatus !== "connected") return;

    void chatHub.invoke("JoinConversation", conversationId).catch(console.error);

    return () => {
      void chatHub.invoke("LeaveConversation", conversationId).catch(() => null);
    };
  }, [conversationId, chatHub, chatStatus]);

  // ── Register event handlers on the shared hub ────────────────────────────────
  // Using chatHub.on / chatHub.off means handlers are added and removed cleanly,
  // even under React StrictMode double-mount.
  useEffect(() => {
    if (!chatHub) return;

    const onMessage = (raw: unknown) => {
      const incoming = toChatMessage(raw);
      if (incoming.conversationId !== conversationId) return;
      upsertMessage(incoming);

      if (incoming.senderId && !sameUserId(incoming.senderId, currentUserIdRef.current)) {
        // User is currently viewing this chat — mark as read immediately so the
        // badge never increments and the sender gets the read receipt right away.
        if (incoming.id) {
          chatState.markConversationRead(conversationId);
          if (chatHub && chatHub.state === HubConnectionState.Connected) {
            void chatHub.invoke("MarkMessageAsRead", incoming.id, conversationId).catch(() => {
              requestBulkReadFallback();
            });
          } else {
            requestBulkReadFallback();
          }
        }

        const preview =
          (incoming.content?.length ?? 0) > 50
            ? `${incoming.content!.substring(0, 50)}...`
            : (incoming.content ?? "");

        toast.info("Nytt meddelande", { description: preview, duration: 4000 });

        if (document.hidden) {
          showNotification("Nytt meddelande", {
            body: preview,
            tag: `chat-${conversationId}`,
            requireInteraction: false,
          });
        }

        playNotificationSound();
      }
    };

    const onMessageRead = (data: {
      MessageId?: string; messageId?: string;
      ReadAt?: string; readAt?: string;
    }) => {
      const msgId = normalizeMessageId(data.MessageId ?? data.messageId);
      if (!msgId) return;
      queueReadUpdate(msgId, data.ReadAt ?? data.readAt);
    };

    const onConversationReadBatch = (data: {
      MessageIds?: string[]; messageIds?: string[];
      ReadAt?: string; readAt?: string;
    }) => {
      applyConversationReadBatch(data);
    };

    const onUserTyping = (data: {
      UserId?: string; userId?: string;
      IsTyping?: boolean; isTyping?: boolean;
      ConversationId?: string; conversationId?: string;
    }) => {
      const typingUserId = data.UserId ?? data.userId;
      const isTyping = data.IsTyping ?? data.isTyping ?? false;
      if (typingUserId && typingUserId !== currentUserIdRef.current) {
        setIsOtherUserTyping(isTyping);
        if (isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherUserTyping(false), 5000);
        }
      }
    };

    chatHub.on("ReceiveMessage", onMessage);
    chatHub.on("MessageRead", onMessageRead);
    chatHub.on("ConversationReadBatch", onConversationReadBatch);
    chatHub.on("UserTyping", onUserTyping);

    return () => {
      chatHub.off("ReceiveMessage", onMessage);
      chatHub.off("MessageRead", onMessageRead);
      chatHub.off("ConversationReadBatch", onConversationReadBatch);
      chatHub.off("UserTyping", onUserTyping);
    };
  }, [
    chatHub,
    conversationId,
    upsertMessage,
    queueReadUpdate,
    applyConversationReadBatch,
    requestBulkReadFallback,
  ]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !currentUserId) return;
      const trimmed = text.trim();
      if (!trimmed || !isChatOpen) return;

      try {
        if (chatHub && chatHub.state === HubConnectionState.Connected) {
          await chatHub.invoke("SendMessage", trimmed, conversationId, bookingId ?? null);
        } else {
          await sendMessageHttp(conversationId, { senderId: currentUserId, content: trimmed });
        }
      } catch (err) {
        console.error("Send message failed", err);
        setError("Could not send message");
      }
    },
    [conversationId, currentUserId, bookingId, isChatOpen, chatHub]
  );

  const startTyping = useCallback(() => {
    if (chatHub && chatHub.state === HubConnectionState.Connected && conversationId) {
      void chatHub.invoke("StartTyping", conversationId);
    }
  }, [chatHub, conversationId]);

  const stopTyping = useCallback(() => {
    if (chatHub && chatHub.state === HubConnectionState.Connected && conversationId) {
      void chatHub.invoke("StopTyping", conversationId);
    }
  }, [chatHub, conversationId]);

  return {
    messages,
    sendMessage,
    markConversationAsRead,
    startTyping,
    stopTyping,
    isOtherUserTyping,
    status: chatStatus,
    isChatOpen,
    isLoadingHistory,
    error,
  };
}
