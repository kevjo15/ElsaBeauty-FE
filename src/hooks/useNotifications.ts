import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NOTIFICATIONS_URL } from "@/services/api/apiUrl";
import { playNotificationSound } from "@/utils/notifications";
import { api } from "@/services/api/apiService";
import { markConversationAsReadHttp } from "@/services/api/chatAPI";
import type { AppNotification } from "@/services/api/types";
import { NotificationType } from "@/services/api/types";
import { useSignalR } from "@/contexts/SignalRContext";
import { useChatState } from "@/contexts/ChatStateContext";
import type { ConnectionStatus } from "@/contexts/SignalRContext";

const MAX_STORED = 20;

export function notificationTypeLabel(type: NotificationType): string {
  switch (Number(type)) {
    case NotificationType.BookingReminder:     return "Påminnelse";
    case NotificationType.BookingConfirmation: return "Bokningsbekräftelse";
    case NotificationType.BookingCancellation: return "Avbokning";
    case NotificationType.BookingUpdated:      return "Bokning uppdaterad";
    case NotificationType.MessageReceived:     return "Nytt meddelande";
    default:                                   return "Notifikation";
  }
}

// .NET sends DateTime without timezone suffix when EF Core reads from DB
// (DateTimeKind.Unspecified). Appending "Z" ensures JS treats it as UTC
// instead of local time, which would cause an offset equal to the user's UTC offset.
function asUtcString(val: unknown): string {
  if (!val || typeof val !== "string") return new Date().toISOString();
  if (val.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(val)) return val;
  return val + "Z";
}

function toAppNotification(raw: unknown): AppNotification | null {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const id = (r.id ?? r.Id) as string | undefined;
  if (!id) return null;
  return {
    id,
    title: ((r.title ?? r.Title) as string) || notificationTypeLabel((r.type ?? r.Type ?? 0) as NotificationType),
    message: ((r.message ?? r.Message) as string) || "",
    createdAt: asUtcString(r.createdAt ?? r.CreatedAt),
    isRead: Boolean(r.isRead ?? r.IsRead ?? false),
    type: (r.type ?? r.Type ?? 0) as NotificationType,
    bookingId: (r.bookingId ?? r.BookingId) as string | undefined,
    userId: ((r.userId ?? r.UserId) as string) || "",
    conversationId: (r.conversationId ?? r.ConversationId) as string | undefined,
  };
}

async function fetchNotificationsFromApi(): Promise<AppNotification[]> {
  try {
    const res = await api.get<unknown[]>(NOTIFICATIONS_URL, {
      params: { limit: MAX_STORED },
    });
    return (res.data ?? []).map(toAppNotification).filter(Boolean) as AppNotification[];
  } catch {
    return [];
  }
}

async function markAsReadOnApi(id: string): Promise<void> {
  try { await api.patch(`${NOTIFICATIONS_URL}/${id}/read`); } catch { /* best-effort */ }
}

async function deleteOnApi(id: string): Promise<void> {
  try { await api.delete(`${NOTIFICATIONS_URL}/${id}`); } catch { /* best-effort */ }
}

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  freshIds: Set<string>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearFreshId: (id: string) => void;
  clearAllFreshIds: () => void;
  clearAll: () => void;
}

export function useNotifications(userId: string | undefined): UseNotificationsResult {
  const { notificationHub, notificationStatus } = useSignalR();

  // Destructure only stable function refs from context (all are useCallback with [] deps).
  // This prevents loadFromApi and other callbacks from being recreated when unreadCounts
  // changes — which was causing the loading skeleton to flash on every badge update.
  const {
    setInitialUnreadCounts,
    incrementUnread,
    markConversationRead,
    subscribeToConversationRead,
    getActiveConversationId,
  } = useChatState();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const notificationsRef = useRef<AppNotification[]>([]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  const localReadIds = useRef<Set<string>>(new Set());

  const applyLocalReadState = useCallback((ids: Iterable<string>) => {
    const idSet = new Set(ids);
    if (idSet.size === 0) return;

    idSet.forEach((id) => localReadIds.current.add(id));
    setNotifications((prev) =>
      prev.map((n) => (idSet.has(n.id) ? { ...n, isRead: true } : n))
    );
    setFreshIds((prev) => {
      const next = new Set(prev);
      idSet.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const persistNotificationReads = useCallback((ids: Iterable<string>) => {
    for (const id of ids) {
      void markAsReadOnApi(id);
    }
  }, []);

  const markConversationNotificationsRead = useCallback(
    (conversationId: string) => {
      const convIdLower = conversationId.toLowerCase();
      const ids = notificationsRef.current
        .filter(
          (n) =>
            n.conversationId?.toLowerCase() === convIdLower &&
            Number(n.type) === NotificationType.MessageReceived &&
            !n.isRead
        )
        .map((n) => n.id);

      if (ids.length === 0) return;

      applyLocalReadState(ids);
      persistNotificationReads(ids);
    },
    [applyLocalReadState, persistNotificationReads]
  );

  // ── Load from API ─────────────────────────────────────────────────────────────
  // setInitialUnreadCounts is stable (useCallback [] in ChatStateContext), so
  // loadFromApi is created once and never triggers spurious re-renders.
  const loadFromApi = useCallback(async () => {
    setLoading(true);
    const fetched = await fetchNotificationsFromApi();

    const normalized = fetched
      .map((n) => (localReadIds.current.has(n.id) ? { ...n, isRead: true } : n))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_STORED);

    setNotifications(normalized);

    // Seed chat badge counts from unread MessageReceived notifications.
    const unreadByConv = normalized
      .filter(
        (n) =>
          !n.isRead &&
          Number(n.type) === NotificationType.MessageReceived &&
          n.conversationId
      )
      .reduce<Record<string, number>>((acc, n) => {
        acc[n.conversationId!] = (acc[n.conversationId!] ?? 0) + 1;
        return acc;
      }, {});

    setInitialUnreadCounts(unreadByConv);
    setLoading(false);
  }, [setInitialUnreadCounts]);

  // ── Initial load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setNotifications([]); return; }
    void loadFromApi();
  }, [userId, loadFromApi]);

  // ── Refetch after reconnect (not on initial connect) ─────────────────────────
  const prevStatusRef = useRef<ConnectionStatus>("disconnected");
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = notificationStatus;
    if (notificationStatus === "connected" && prev === "reconnecting") {
      void loadFromApi();
    }
  }, [notificationStatus, loadFromApi]);

  // ── React when a conversation is marked as read ───────────────────────────────
  // Mark all MessageReceived notifications for that conversation as read on BE.
  useEffect(() => {
    const unsubscribe = subscribeToConversationRead((convId) => {
      markConversationNotificationsRead(convId);
    });
    return unsubscribe;
  }, [subscribeToConversationRead, markConversationNotificationsRead]);

  // ── Subscribe to notification hub ─────────────────────────────────────────────
  useEffect(() => {
    if (!notificationHub || !userId) return;

    const handleNotification = (raw: unknown) => {
      const incoming = toAppNotification(raw);
      if (!incoming) return;

      const isMessageNotif =
        Number(incoming.type) === NotificationType.MessageReceived &&
        !!incoming.conversationId;

      // getActiveConversationId() reads a ref — always current, never stale.
      // Compare case-insensitively: GUID casing can differ between API and hub events.
      const isViewingChat =
        isMessageNotif &&
        incoming.conversationId!.toLowerCase() === (getActiveConversationId() ?? "").toLowerCase();

      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        // Pre-mark as read when user is actively viewing this conversation —
        // avoids any brief unread flash while waiting for the listener to fire.
        const notif = isViewingChat ? { ...incoming, isRead: true } : incoming;
        return [notif, ...prev].slice(0, MAX_STORED);
      });

      if (isMessageNotif) {
        if (isViewingChat) {
          markConversationRead(incoming.conversationId!);
          applyLocalReadState([incoming.id]);
          persistNotificationReads([incoming.id]);
        } else {
          incrementUnread(incoming.conversationId!);
        }
      }

      // Skip toast / sound / fresh badge when user is already reading this chat
      if (!isViewingChat) {
        setFreshIds((prev) => new Set([...prev, incoming.id]));
        toast.info(incoming.title, { description: incoming.message, duration: 5000 });
        playNotificationSound();
      }
    };

    notificationHub.on("ReceiveNotification", handleNotification);
    return () => notificationHub.off("ReceiveNotification", handleNotification);
  }, [
    notificationHub,
    userId,
    getActiveConversationId,
    incrementUnread,
    markConversationRead,
    applyLocalReadState,
    persistNotificationReads,
  ]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    (id: string) => {
      const notification = notificationsRef.current.find((n) => n.id === id);

      if (
        notification &&
        Number(notification.type) === NotificationType.MessageReceived &&
        notification.conversationId
      ) {
        markConversationRead(notification.conversationId);
      }

      applyLocalReadState([id]);
      persistNotificationReads([id]);
    },
    [markConversationRead, applyLocalReadState, persistNotificationReads]
  );

  const markAllAsRead = useCallback(() => {
    const unread = notificationsRef.current.filter((n) => !n.isRead);

    const convIds = new Set(
      unread
        .filter((n) => Number(n.type) === NotificationType.MessageReceived && n.conversationId)
        .map((n) => n.conversationId!)
    );
    convIds.forEach((convId) => {
      void markConversationAsReadHttp(convId);
      markConversationRead(convId);
    });

    const unreadIds = unread.map((n) => n.id);
    applyLocalReadState(unreadIds);
    persistNotificationReads(unreadIds);
  }, [markConversationRead, applyLocalReadState, persistNotificationReads]);

  const clearFreshId = useCallback((id: string) => {
    setFreshIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const clearAllFreshIds = useCallback(() => setFreshIds(new Set()), []);

  const clearAll = useCallback(() => {
    notificationsRef.current.forEach((n) => void deleteOnApi(n.id));
    setNotifications([]);
    setFreshIds(new Set());
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    freshIds,
    markAsRead,
    markAllAsRead,
    clearFreshId,
    clearAllFreshIds,
    clearAll,
  };
}
