import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { toast } from "sonner";
import { CHAT_HUB_URL } from "@/services/api/apiUrl";
import {
  fetchConversationMessages,
  sendMessageHttp,
  toChatMessage,
} from "@/services/api/chatAPI";
import type { BookingChatMeta, ChatMessage } from "@/services/api/types";
import { getCookie } from "@/services/api/authService";
import {
  requestNotificationPermission,
  showNotification,
  playNotificationSound,
} from "@/utils/notifications";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

interface UseSignalRChatOptions {
  conversationId?: string;
  currentUserId?: string;
  bookingMeta?: BookingChatMeta;
}

interface UseSignalRChatResult {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  isOtherUserTyping: boolean;
  status: ConnectionStatus;
  isChatOpen: boolean;
  isLoadingHistory: boolean;
  error?: string;
}

/**
 * Hook that encapsulates SignalR connection lifecycle + chat history for a booking conversation.
 */
export function useSignalRChat({
  conversationId,
  currentUserId,
  bookingMeta,
}: UseSignalRChatOptions): UseSignalRChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string>();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | undefined>(currentUserId);

  // Keep ref in sync with prop
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Request notification permission when hook mounts
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  const isChatOpen = useMemo(() => {
    // Prefer explicit flag from backend if provided
    if (typeof bookingMeta?.isChatOpen === "boolean") {
      return bookingMeta.isChatOpen;
    }
    // Close if booking cancelled
    const statusText = bookingMeta?.status?.toLowerCase() ?? "";
    if (statusText.includes("cancel")) return false;

    // Grace window: allow chat until some hours after end (and any time before end)
    const graceHours = 24; // adjust as needed
    if (!bookingMeta?.endTime) return true;
    const now = new Date();
    const end = new Date(bookingMeta.endTime);
    const graceMs = graceHours * 60 * 60 * 1000;
    return now.getTime() <= end.getTime() + graceMs;
  }, [bookingMeta?.endTime, bookingMeta?.isChatOpen, bookingMeta?.status]);

  // Helper: ensure messages stay sorted and de-duplicated
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const merged = [...prev];
      let found = false;

      // Strategy 1: Match by ID
      if (incoming.id) {
        const idx = merged.findIndex((m) => m.id === incoming.id);
        if (idx !== -1) {
          merged[idx] = incoming;
          found = true;
        }
      }

      // Strategy 2: Match by content + sender + approx time if ID missing
      if (!found) {
        const idx = merged.findIndex(
          (m) =>
            (!m.id || !incoming.id) && // Only if one is missing ID
            m.senderId === incoming.senderId &&
            m.content === incoming.content &&
            Math.abs(
              new Date(m.sentAt).getTime() - new Date(incoming.sentAt).getTime()
            ) < 10000 // 10s window
        );

        if (idx !== -1) {
          // If incoming has ID (and match didn't), replace it
          if (incoming.id) {
            merged[idx] = incoming;
          }
          // If neither has ID or both (unlikely given Strategy 1), just update
          else {
            merged[idx] = incoming;
          }
          found = true;
        }
      }

      if (!found) {
        merged.push(incoming);
      }

      return merged.sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    });
  }, []);

  // Fetch initial history when conversationId changes
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const history = await fetchConversationMessages(conversationId);
        if (!cancelled) {
          setMessages(
            (history ?? []).sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            )
          );
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        if (!cancelled) {
          setError("Could not load chat history");
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
      setMessages([]);
    };
  }, [conversationId]);

  // Build and start SignalR connection
  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;

    const startConnection = async () => {
      // Avoid multiple connections (React strict mode double effects)
      if (connectionRef.current) {
        return;
      }

      setStatus("connecting");
      setError(undefined);
      const accessToken = getCookie("accessToken");

      const connection = new HubConnectionBuilder()
        .withUrl(CHAT_HUB_URL, {
          accessTokenFactory: () => accessToken ?? "",
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Hold reference immediately so a second render doesn't create another connection
      connectionRef.current = connection;

      connection.on("ReceiveMessage", (message: ChatMessage) => {
        const incoming = toChatMessage(message);
        // Om avsändare saknas (backend skickar ej), låt den vara tom så den inte misstas som min
        upsertMessage(incoming);

        // Visa notifikation om meddelandet inte är från mig själv
        const isMyMessage = currentUserId && incoming.senderId === currentUserId;
        if (!isMyMessage && incoming.content) {
          const preview = incoming.content.length > 50
            ? `${incoming.content.substring(0, 50)}...`
            : incoming.content;

          // Toast notification (always shows)
          toast.info("Nytt meddelande", {
            description: preview,
            duration: 4000,
          });

          // Desktop notification (only if tab is not focused)
          if (document.hidden) {
            showNotification("Nytt meddelande", {
              body: preview,
              tag: `chat-${conversationId}`,
              requireInteraction: false,
            });
          }

          // Play notification sound
          playNotificationSound();
        }
      });
      // Listen for read receipts
      connection.on("MessageRead", (data: { MessageId?: string; messageId?: string; ReadAt?: string; readAt?: string; ReadBy?: string; readBy?: string }) => {
        const msgId = data.MessageId ?? data.messageId;
        const readAtTime = data.ReadAt ?? data.readAt;
        console.log("MessageRead received:", { msgId, readAtTime, rawData: data });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, readAt: readAtTime } : m
          )
        );
      });

      // Listen for typing indicators
      connection.on("UserTyping", (data: { UserId?: string; userId?: string; IsTyping?: boolean; isTyping?: boolean; ConversationId?: string; conversationId?: string }) => {
        console.log("=== UserTyping EVENT RECEIVED ===");
        console.log("Raw data:", JSON.stringify(data));
        const typingUserId = data.UserId ?? data.userId;
        const isTyping = data.IsTyping ?? data.isTyping ?? false;
        const eventConversationId = data.ConversationId ?? data.conversationId;
        const myUserId = currentUserIdRef.current;

        console.log("Parsed:", { typingUserId, isTyping, eventConversationId, myUserId, currentConversationId: conversationId });

        // Only show typing indicator if it's not from current user
        if (typingUserId && typingUserId !== myUserId) {
          console.log(">>> Setting isOtherUserTyping to:", isTyping);
          setIsOtherUserTyping(isTyping);

          // Auto-clear typing indicator after 5 seconds (in case StopTyping is missed)
          if (isTyping) {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              console.log(">>> Auto-clearing typing indicator after timeout");
              setIsOtherUserTyping(false);
            }, 5000);
          }
        } else {
          console.log(">>> Ignoring typing event (from self or missing userId)");
        }
      });

      // Log when we successfully join a conversation
      connection.on("JoinedConversation", (convId: string) => {
        console.log("=== JOINED CONVERSATION ===", convId);
      });
      connection.on("LeftConversation", (convId: string) => {
        console.log("=== LEFT CONVERSATION ===", convId);
      });

      connection.onreconnecting(() => {
        if (isMounted) setStatus("reconnecting");
      });

      connection.onreconnected(() => {
        if (isMounted) setStatus("connected");
        // Re-join conversation after reconnection
        if (connection.state === HubConnectionState.Connected) {
          connection
            .invoke("JoinConversation", conversationId)
            .catch((err) =>
              console.error("Failed to rejoin conversation", err)
            );
        }
      });

      connection.onclose(() => {
        if (isMounted) setStatus("disconnected");
      });

      try {
        await connection.start();
        if (!isMounted) return;
        setStatus("connected");
        await connection.invoke("JoinConversation", conversationId);
      } catch (err) {
        const message = (err as Error)?.message ?? "";
        // In React StrictMode the first render's effect is cleaned up immediately, causing AbortError.
        const isAbort =
          message.includes("stopped during negotiation") ||
          (err as Error).name === "AbortError";
        if (!isAbort) {
          console.error("Failed to start SignalR connection", err);
        }
        if (isMounted) {
          setError(isAbort ? undefined : "Could not connect to chat");
          setStatus("disconnected");
          connectionRef.current = null;
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        conn
          .invoke("LeaveConversation", conversationId)
          .catch(() => null)
          .finally(() => conn.stop().catch(() => null));
      }
    };
  }, [conversationId, upsertMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !currentUserId) {
        setError("Missing conversation or user");
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!isChatOpen) {
        setError("Chat is closed for this booking");
        return;
      }

      const payload: ChatMessage = {
        conversationId,
        senderId: currentUserId,
        content: trimmed,
        sentAt: new Date().toISOString(),
      };

      try {
        if (
          connectionRef.current &&
          connectionRef.current.state === HubConnectionState.Connected
        ) {
          await connectionRef.current.invoke(
            "SendMessage",
            payload.content,
            conversationId
          );
        } else {
          // Fallback to HTTP if connection is not ready; UI will update when server echoes back
          await sendMessageHttp(conversationId, {
            senderId: currentUserId,
            content: payload.content,
          });
        }
      } catch (err) {
        console.error("Send message failed", err);
        setError("Could not send message");
      }
    },
    [conversationId, currentUserId, isChatOpen, upsertMessage]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!conversationId || !messageId) {
        console.log("markAsRead skipped - missing data:", { conversationId, messageId });
        return;
      }

      try {
        if (
          connectionRef.current &&
          connectionRef.current.state === HubConnectionState.Connected
        ) {
          console.log("Invoking MarkMessageAsRead:", { messageId, conversationId });
          await connectionRef.current.invoke(
            "MarkMessageAsRead",
            messageId,
            conversationId
          );
          console.log("MarkMessageAsRead successful");
        } else {
          console.log("Connection not ready for markAsRead");
        }
      } catch (err) {
        console.error("Mark as read failed", err);
      }
    },
    [conversationId]
  );

  const startTyping = useCallback(() => {
    if (!conversationId) {
      console.log("startTyping: No conversationId");
      return;
    }

    try {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        console.log("=== INVOKING StartTyping ===", { conversationId, userId: currentUserIdRef.current });
        void connectionRef.current.invoke("StartTyping", conversationId);
      } else {
        console.log("startTyping: Connection not ready, state:", connectionRef.current?.state);
      }
    } catch (err) {
      console.error("StartTyping failed", err);
    }
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    try {
      if (
        connectionRef.current &&
        connectionRef.current.state === HubConnectionState.Connected
      ) {
        void connectionRef.current.invoke("StopTyping", conversationId);
      }
    } catch (err) {
      console.error("StopTyping failed", err);
    }
  }, [conversationId]);

  return {
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    isOtherUserTyping,
    status,
    isChatOpen,
    isLoadingHistory,
    error,
  };
}
