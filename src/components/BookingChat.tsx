import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { useAuth } from "@/services/api/authContext";
import type { BookingResponse, ChatMessage } from "@/services/api/types";
import { Clock, MessageCircle, Send, ShieldAlert, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type BookingWithChat = BookingResponse & {
  conversationId: string;
};

interface BookingChatProps {
  booking: BookingWithChat;
}

const formatTimestamp = (ts: string) =>
  format(new Date(ts), "d MMM HH:mm", { locale: sv });

export const BookingChat: React.FC<BookingChatProps> = ({ booking }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    sendMessage,
    status,
    isChatOpen,
    isLoadingHistory,
    error,
  } = useSignalRChat({
    conversationId: booking.conversationId,
    currentUserId: currentUserId ?? undefined,
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

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await sendMessage(draft);
    setDraft("");
  };

  const closedReason =
    !isChatOpen || (booking.status ?? "").toLowerCase().includes("cancel")
      ? "Chat for this booking is closed."
      : null;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Chat</p>
          <p className="text-xs text-base-content/60">
            Booking {format(new Date(booking.startTime), "d MMM HH:mm", { locale: sv })}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

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
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-base-200/40"
      >
        {isLoadingHistory && (
          <div className="text-sm text-base-content/60">Loading history...</div>
        )}
        {!isLoadingHistory && sortedMessages.length === 0 && (
          <div className="text-sm text-base-content/60">No messages yet.</div>
        )}

        {sortedMessages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div
              key={`${m.id ?? ""}-${m.sentAt}-${m.senderId}-${m.content}`}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                  isMine
                    ? "bg-primary text-primary-content rounded-br-sm"
                    : "bg-base-100 border border-base-300 rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {m.content}
                </p>
                <p
                  className={`mt-1 text-[11px] ${
                    isMine ? "text-primary-content/80" : "text-base-content/60"
                  }`}
                >
                  {formatTimestamp(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSend} className="border-t border-base-300 p-3">
        <div className="join w-full">
          <input
            className="input input-bordered join-item w-full"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              closedReason ? "Chat is closed" : "Write a message..."
            }
            disabled={!isChatOpen || !currentUserId}
          />
          <button
            type="submit"
            className="btn btn-primary join-item"
            disabled={!draft.trim() || !isChatOpen || !currentUserId}
            title={!currentUserId ? "You need to be logged in" : undefined}
          >
            <Send className="h-4 w-4" />
            Skicka
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
