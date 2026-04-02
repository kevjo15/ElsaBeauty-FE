import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { useAuth } from "@/services/api/authContext";
import type { BookingResponse, ChatMessage } from "@/services/api/types";
import { getAllServices } from "@/services/api/serviceAPI";
import { useChatState } from "@/contexts/ChatStateContext";
import { ArrowLeft, Clock, Info, MessageCircle, Send, ShieldAlert, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type BookingWithChat = BookingResponse & {
  conversationId: string;
};

const buildName = (...parts: (string | undefined)[]) =>
  parts
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(" ");

const looksLikeGuid = (val?: string) => {
  const v = val?.trim() ?? "";
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    v
  );
};

const displayOrFallback = (name: string | undefined, fallback: string) => {
  if (!name) return fallback;
  return looksLikeGuid(name) ? fallback : name;
};
const hasReadAt = (value?: string) => typeof value === "string" && value.trim().length > 0;
const sameUserId = (left?: string, right?: string) =>
  (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();

interface BookingChatProps {
  booking: BookingWithChat;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  senderName?: string;
}

const formatTimestamp = (ts: string) =>
  format(new Date(ts), "HH:mm", { locale: sv });

const shouldShowHeader = (
  current: ChatMessage,
  previous: ChatMessage | undefined
): boolean => {
  if (!previous) return true;
  if (current.senderId !== previous.senderId) return true;

  // Visa header om det gått mer än 5 minuter mellan meddelanden
  const timeDiff = new Date(current.sentAt).getTime() - new Date(previous.sentAt).getTime();
  return timeDiff > 5 * 60 * 1000;
};

const ChatMessageBubble: React.FC<ChatMessageBubbleProps & { showHeader?: boolean }> = ({
  message,
  isMine,
  senderName,
  showHeader = true,
}) => {
  return (
    <div
      className={`chat ${isMine ? "chat-end" : "chat-start"} ${!showHeader ? "mt-0.5" : "mt-4"}`}
      data-message-id={message.id}
      data-sender-id={message.senderId}
      data-read={message.readAt ? 'true' : 'false'}
    >
      {showHeader && (
        <div className="chat-header text-xs opacity-50 mb-1">
          {senderName}
          <time className="ml-1">{formatTimestamp(message.sentAt)}</time>
        </div>
      )}
      <div
        className={`chat-bubble break-words max-w-xs sm:max-w-md md:max-w-lg overflow-wrap-anywhere ${
          isMine ? "chat-bubble-primary" : "chat-bubble-secondary"
        }`}
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        {message.content}
      </div>
      {isMine && (
        <div className="chat-footer text-xs mt-0.5">
          {message.readAt ? (
            <span className="text-info" title={`Läst ${formatTimestamp(message.readAt)}`}>✓✓</span>
          ) : (
            <span className="opacity-50">✓</span>
          )}
        </div>
      )}
    </div>
  );
};

export const BookingChat: React.FC<BookingChatProps> = ({ booking }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markConversationRead } = useChatState();
  const currentUserId = user?.id ?? "";
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const [fetchedServiceName, setFetchedServiceName] = useState<string | null>(null);
  const lastAutoReadSignatureRef = useRef("");

  // Hämta service-namn om det inte finns med i booking
  useEffect(() => {
    const fetchServiceName = async () => {
      // Om vi redan har service-namnet, skippa
      if (booking.service?.name || booking.serviceName) {
        return;
      }

      // Annars hämta alla services och hitta rätt en
      if (booking.serviceId) {
        try {
          const services = await getAllServices();
          const service = services.find((s) => s.id === booking.serviceId);
          if (service) {
            setFetchedServiceName(service.name);
          }
        } catch (error) {
          console.error("Failed to fetch service name:", error);
        }
      }
    };

    void fetchServiceName();
  }, [booking.serviceId, booking.service, booking.serviceName]);

  const serviceName = useMemo(
    () => booking.service?.name || booking.serviceName || fetchedServiceName,
    [booking, fetchedServiceName]
  );

  const bookingDateTime = useMemo(() => {
    if (!booking.startTime) return '';
    const date = new Date(booking.startTime);
    const dateStr = date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} • ${timeStr}`;
  }, [booking.startTime]);

  const employeeDisplayName = useMemo(() => {
    const fromEmployee = buildName(
      booking.employee?.firstName,
      booking.employee?.lastName
    );

    return (
      booking.employeeName?.trim() ||
      fromEmployee ||
      booking.employeeId ||
      ""
    );
  }, [booking]);

  const customerDisplayName = useMemo(() => {
    const fromUser = buildName(booking.user?.firstName, booking.user?.lastName);
    const emailHandle = booking.user?.email?.split("@")[0];

    return (
      booking.customerName?.trim() ||
      fromUser ||
      emailHandle ||
      booking.userId ||
      ""
    );
  }, [booking]);

  const isCustomer =
    !!currentUserId &&
    !!booking.userId &&
    currentUserId.toLowerCase() === booking.userId.toLowerCase();

  const otherName = displayOrFallback(
    isCustomer ? employeeDisplayName : customerDisplayName,
    isCustomer ? "Personal" : "Kund"
  );

  const myDisplayName =
    displayOrFallback(
      buildName(user?.firstName, user?.lastName) ||
        (isCustomer ? customerDisplayName : employeeDisplayName),
      "Du"
    );

  const { messages, sendMessage, markConversationAsRead, startTyping, stopTyping, isOtherUserTyping, status, isChatOpen, isLoadingHistory, error } =
    useSignalRChat({
      conversationId: booking.conversationId,
      currentUserId,
      bookingId: booking.id,
      bookingMeta: {
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        isChatOpen: booking.isChatOpen,
      },
    });

  const sortedMessages = useMemo<ChatMessage[]>(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      ),
    [messages]
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [sortedMessages.length]);

  // When chat finishes loading: mark conversation as read in shared state and on BE.
  // Using chatState ensures badge clears immediately across all components.
  // The HTTP call marks messages on BE and broadcasts MessageRead to the sender.
  useEffect(() => {
    if (isLoadingHistory || !currentUserId) return;

    const unreadSignature = sortedMessages
      .filter((m) => !sameUserId(m.senderId, currentUserId) && !hasReadAt(m.readAt))
      .map((m) => m.id ?? `${m.senderId}:${m.sentAt}:${m.content}`)
      .join("|");

    if (!unreadSignature) {
      lastAutoReadSignatureRef.current = "";
      return;
    }

    if (lastAutoReadSignatureRef.current === unreadSignature) {
      return;
    }

    lastAutoReadSignatureRef.current = unreadSignature;
    markConversationRead(booking.conversationId);
    markConversationAsRead();
  }, [isLoadingHistory, currentUserId, sortedMessages, booking.conversationId, markConversationRead, markConversationAsRead]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);

    const hasText = e.target.value.trim().length > 0;

    // Send startTyping every 2 seconds while typing (to keep indicator alive)
    const now = Date.now();
    if (hasText && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      startTyping();
    }

    // Clear previous timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2.5 seconds of inactivity
    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      // If text is empty, stop typing immediately
      stopTyping();
    }
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    // Stop typing when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();
    lastTypingSentRef.current = 0;

    await sendMessage(draft);
    setDraft("");
  };

  const closedReason =
    !isChatOpen || (booking.status ?? "").toLowerCase().includes("cancel")
      ? "Chat for this booking is closed."
      : null;

  return (
    <div className="flex flex-col h-[85vh] max-h-[900px] rounded-2xl border border-base-300 bg-base-100 shadow-lg">
      <div className="border-b border-base-300 bg-base-200/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            aria-label="Tillbaka"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-base truncate">
                {otherName}
              </p>
            </div>
            {(serviceName || bookingDateTime) && (
              <div className="text-right shrink-0">
                {serviceName && (
                  <p className="text-sm text-base-content/80 font-medium">
                    {serviceName}
                  </p>
                )}
                {bookingDateTime && (
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {bookingDateTime}
                  </p>
                )}
              </div>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {isCustomer && (
        <div className="bg-info/20 border-b border-info/30 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-info shrink-0" />
            <p className="text-base-content/90 font-medium">
              Du chattar med din sköterska {employeeDisplayName ? `(${displayOrFallback(employeeDisplayName, "Personal")})` : ""} om din kommande behandling
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-warning rounded-none">
          <ShieldAlert className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {closedReason && (
        <div className="alert alert-info rounded-none">
          <Clock className="h-4 w-4" />
          <span>{closedReason}</span>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 bg-base-200/40"
      >
        {isLoadingHistory && (
          <div className="text-sm text-base-content/60">Loading history...</div>
        )}
        {!isLoadingHistory && sortedMessages.length === 0 && (
          <div className="text-sm text-base-content/60">No messages yet.</div>
        )}

        {sortedMessages.map((m, index) => {
          const isMine =
            !!m.senderId &&
            !!currentUserId &&
            m.senderId.toLowerCase() === currentUserId.toLowerCase();

          const senderLabel = isMine ? myDisplayName : otherName;
          const previousMessage = index > 0 ? sortedMessages[index - 1] : undefined;
          const showHeader = shouldShowHeader(m, previousMessage);

          return (
            <ChatMessageBubble
              key={`${m.id ?? ""}-${m.sentAt}-${m.senderId}-${m.content}`}
              message={m}
              isMine={isMine}
              senderName={senderLabel || (isMine ? "Du" : "Gäst")}
              showHeader={showHeader}
            />
          );
        })}

      </div>

      {/* Typing indicator - fixed position above input */}
      {isOtherUserTyping && (
        <div className="px-4 py-2 bg-base-200/50 border-t border-base-300">
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <span className="loading loading-dots loading-xs"></span>
            <span>{otherName} skriver...</span>
          </div>
        </div>
      )}

      <form onSubmit={onSend} className="border-t border-base-300 p-4 bg-base-100">
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
            value={draft}
            onChange={handleInputChange}
            placeholder={closedReason ? "Chatten är stängd" : "Skriv ett meddelande..."}
            disabled={!isChatOpen || !currentUserId}
          />
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={!draft.trim() || !isChatOpen || !currentUserId}
            title={!currentUserId ? "Du måste vara inloggad" : undefined}
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Skicka</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "connected":
      return <span className="badge badge-success gap-1">Online</span>;
    case "reconnecting":
    case "connecting":
      return (
        <span className="badge badge-warning gap-1">
          <WifiOff className="h-3 w-3" />
          Återansluter
        </span>
      );
    default:
      return (
        <span className="badge badge-outline gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </span>
      );
  }
};

export default BookingChat;
