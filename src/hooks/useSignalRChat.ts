import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { CHAT_HUB_URL } from "@/services/api/apiUrl";
import {
  fetchConversationMessages,
  sendMessageHttp,
  toChatMessage,
} from "@/services/api/chatAPI";
import type { BookingChatMeta, ChatMessage } from "@/services/api/types";
import { getCookie } from "@/services/api/authService";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface UseSignalRChatOptions {
  conversationId?: string;
  currentUserId?: string;
  bookingMeta?: BookingChatMeta;
}

interface UseSignalRChatResult {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
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
  const connectionRef = useRef<HubConnection | null>(null);

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
    return now <= end.getTime() + graceMs;
  }, [bookingMeta?.endTime, bookingMeta?.isChatOpen, bookingMeta?.status]);

  // Helper: ensure messages stay sorted and de-duplicated on id+timestamp+content
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const key = (m: ChatMessage) =>
        `${m.id ?? ""}-${m.sentAt}-${m.senderId}-${m.content}`;
      const map = new Map<string, ChatMessage>();
      [...prev, incoming].forEach((m) => map.set(key(m), m));
      return [...map.values()].sort(
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
              (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
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
        upsertMessage(toChatMessage(message));
      });
      // Avoid console warnings for hub callbacks we don't actively use
      connection.on("JoinedConversation", () => {});
      connection.on("LeftConversation", () => {});

      connection.onreconnecting(() => {
        if (isMounted) setStatus("reconnecting");
      });

      connection.onreconnected(() => {
        if (isMounted) setStatus("connected");
        // Re-join conversation after reconnection
        if (connection.state === HubConnectionState.Connected) {
          connection.invoke("JoinConversation", conversationId).catch((err) =>
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
        const isAbort = message.includes("stopped during negotiation") || (err as Error).name === "AbortError";
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
          // Fallback to HTTP if connection is not ready
          await sendMessageHttp(conversationId, {
            senderId: currentUserId,
            content: payload.content,
          });
          upsertMessage(payload);
        }
      } catch (err) {
        console.error("Send message failed", err);
        setError("Could not send message");
      }
    },
    [conversationId, currentUserId, isChatOpen, upsertMessage]
  );

  return {
    messages,
    sendMessage,
    status,
    isChatOpen,
    isLoadingHistory,
    error,
  };
}
