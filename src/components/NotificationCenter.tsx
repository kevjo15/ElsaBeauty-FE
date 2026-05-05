import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Calendar, MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/services/api/authContext";
import { NotificationType } from "@/services/api/types";
import type { AppNotification } from "@/services/api/types";
import { resolveChatBooking } from "@/services/chat/resolveChatBooking";

type FilterType = "all" | "bookings" | "messages";
const PAGE_SIZE = 8;

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (Number(type)) {
    case NotificationType.MessageReceived:
      return <MessageCircle className="h-4 w-4 text-primary shrink-0" />;
    case NotificationType.BookingCancellation:
      return <X className="h-4 w-4 text-error shrink-0" />;
    default:
      return <Calendar className="h-4 w-4 text-success shrink-0" />;
  }
}

function relativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true, locale: sv });
  } catch {
    return "";
  }
}

function NotificationItem({
  notification,
  isFresh,
  onRead,
  onNavigate,
}: {
  notification: AppNotification;
  isFresh: boolean;
  onRead: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
}) {
  const handleClick = () => {
    const isMessageNavigation =
      Number(notification.type) === NotificationType.MessageReceived &&
      !!notification.conversationId;

    if (!isMessageNavigation) {
      onRead(notification.id);
    }
    onNavigate(notification);
  };

  // isFresh = arrived this session via push (show NY badge regardless of isRead)
  // isUnread = not yet read (show dot + light background)
  const isUnread = !notification.isRead;

  return (
    <li>
      <button
        type="button"
        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-base-200/60 cursor-pointer transition-colors ${
          isUnread ? "bg-primary/5" : ""
        }`}
        onClick={handleClick}
      >
        <div className="mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium leading-tight truncate ${
              isUnread ? "text-base-content" : "text-base-content/70"
            }`}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {isFresh && (
                <span className="badge badge-primary badge-xs text-[10px] font-bold px-1.5">
                  NY
                </span>
              )}
              {isUnread && !isFresh && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[11px] text-base-content/40 mt-1">
            {relativeTime(notification.createdAt)}
          </p>
        </div>
      </button>
    </li>
  );
}

interface NotificationCenterProps {
  userId: string | undefined;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const {
    notifications,
    unreadCount,
    loading,
    freshIds,
    markAsRead,
    markAllAsRead,
    clearAllFreshIds,
    clearAll,
  } = useNotifications(userId);
  const { user } = useAuth();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const rootRef = useRef<HTMLDivElement>(null);
  const role = user?.role?.toLowerCase() ?? "";

  // Clear freshIds when dropdown closes — user has seen the notifications
  useEffect(() => {
    if (!open) {
      clearAllFreshIds();
    }
  }, [open, clearAllFreshIds]);

  // Reset pagination when filter or open changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, open]);

  useEffect(() => {
    if (!open) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleNavigate = async (n: AppNotification) => {
    setOpen(false);
    if (Number(n.type) === NotificationType.MessageReceived && n.conversationId) {
      const relatedBookingId =
        n.bookingId ??
        notifications.find(
          (candidate) =>
            candidate.conversationId?.toLowerCase() === n.conversationId?.toLowerCase() &&
            !!candidate.bookingId
        )?.bookingId;

      const resolvedBooking = await resolveChatBooking({
        bookingId: relatedBookingId,
        conversationId: n.conversationId,
        role,
      });

      // Controlled aggressive UX:
      // mark the conversation as read immediately, then navigate.
      navigate(`/chat/${resolvedBooking?.id ?? relatedBookingId ?? n.conversationId}`, {
        state: {
          booking:
            resolvedBooking ?? {
              id: relatedBookingId ?? n.conversationId,
              conversationId: n.conversationId,
            },
          openedFromNotification: true,
        },
      });
    } else if (n.bookingId) {
      navigate("/bookings/history");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "messages") return Number(n.type) === NotificationType.MessageReceived;
    if (filter === "bookings") return Number(n.type) !== NotificationType.MessageReceived;
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div
      ref={rootRef}
      className={`dropdown dropdown-end ${open ? "dropdown-open" : ""}`}
    >
      <button
        type="button"
        className="btn btn-ghost btn-circle relative list-none [&::-webkit-details-marker]:hidden"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="badge badge-primary badge-xs absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
      <div
        className="dropdown-content z-[50] mt-2 w-80 bg-base-100 rounded-xl shadow-xl border border-base-300 flex flex-col max-h-[520px]"
        role="menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <h3 className="font-semibold text-sm">
            Notifikationer
            {unreadCount > 0 && (
              <span className="ml-2 badge badge-primary badge-sm">{unreadCount} nya</span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost btn-xs tooltip tooltip-left"
                data-tip="Markera alla notiser och meddelanden som lästa"
                onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="btn btn-ghost btn-xs tooltip tooltip-left"
                data-tip="Rensa alla"
                onClick={(e) => { e.preventDefault(); clearAll(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-base-300 px-2 pt-1">
          {(["all", "bookings", "messages"] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`flex-1 text-xs py-1.5 rounded-t transition-colors font-medium ${
                filter === f
                  ? "text-primary border-b-2 border-primary"
                  : "text-base-content/50 hover:text-base-content/80"
              }`}
              onClick={(e) => { e.preventDefault(); setFilter(f); }}
            >
              {f === "all" ? "Alla" : f === "bookings" ? "Bokningar" : "Meddelanden"}
            </button>
          ))}
        </div>

        {/* List */}
        <ul className="overflow-y-auto flex-1 divide-y divide-base-200">
          {loading ? (
            <li className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-base-300 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-base-300 rounded w-3/4" />
                    <div className="h-2 bg-base-300 rounded w-full" />
                    <div className="h-2 bg-base-300 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </li>
          ) : visible.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-10 text-base-content/40">
              <Bell className="h-8 w-8" />
              <p className="text-sm">
                {filter === "all"
                  ? "Inga notifikationer"
                  : `Inga ${filter === "messages" ? "meddelanden" : "bokningar"}`}
              </p>
            </li>
          ) : (
            <>
              {visible.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  isFresh={freshIds.has(n.id)}
                  onRead={markAsRead}
                  onNavigate={handleNavigate}
                />
              ))}
              {hasMore && (
                <li className="px-4 py-2 text-center">
                  <button
                    className="btn btn-ghost btn-xs w-full text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      setVisibleCount((c) => c + PAGE_SIZE);
                    }}
                  >
                    Visa fler ({filtered.length - visibleCount} kvar)
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      </div>
      )}
    </div>
  );
};

export default NotificationCenter;
