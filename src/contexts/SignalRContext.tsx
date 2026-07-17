import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  ILogger,
  IRetryPolicy,
  LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "@/services/api/authContext";
import { getAccessToken, isTokenExpired } from "@/services/api/tokenStore";
import { refreshAccessToken } from "@/services/api/apiService";
import { CHAT_HUB_URL, NOTIFICATION_HUB_URL } from "@/services/api/apiUrl";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

// SignalR anropar fabriken vid varje (åter)anslutningsförsök. Efter en längre
// paus (t.ex. låst mobil) har access-tokenen gått ut — utan förnyelse nekas
// alla återanslutningsförsök med 401. Förnya via samma single-flight-refresh
// som axios-interceptorn använder (HttpOnly-cookien gör jobbet).
async function freshAccessToken(): Promise<string> {
  if (!isTokenExpired()) return getAccessToken() ?? "";
  return (await refreshAccessToken()) ?? "";
}

// Ge aldrig upp återanslutningen (default är 4 försök under ~30 s, sedan död
// hubb tills sidan laddas om). Backa upp till 30 s mellan försöken och fortsätt
// tills det lyckas — eller tills utloggning stoppar hubben.
const RETRY_DELAYS_MS = [0, 2000, 5000, 10000, 30000];
const infiniteRetryPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
    RETRY_DELAYS_MS[Math.min(previousRetryCount, RETRY_DELAYS_MS.length - 1)],
};

// Suppresses React StrictMode double-mount noise ("stopped during negotiation").
// The second mount succeeds — this is only cosmetic noise from development mode.
const hubLogger: ILogger = {
  log(level: LogLevel, message: string) {
    if (message.includes("stopped during negotiation")) return;
    if (level >= LogLevel.Error) console.error("[SignalR]", message);
  },
};

interface SignalRContextValue {
  chatHub: HubConnection | null;
  notificationHub: HubConnection | null;
  chatStatus: ConnectionStatus;
  notificationStatus: ConnectionStatus;
}

const SignalRContext = createContext<SignalRContextValue>({
  chatHub: null,
  notificationHub: null,
  chatStatus: "disconnected",
  notificationStatus: "disconnected",
});

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  const [chatHub, setChatHub] = useState<HubConnection | null>(null);
  const [notificationHub, setNotificationHub] = useState<HubConnection | null>(null);
  const [chatStatus, setChatStatus] = useState<ConnectionStatus>("disconnected");
  const [notificationStatus, setNotificationStatus] = useState<ConnectionStatus>("disconnected");

  // Refs hold the live connection objects so cleanup functions always see the latest value.
  const chatRef = useRef<HubConnection | null>(null);
  const notifRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // Wait until auth is fully resolved before attempting any connections.
    if (isLoading || !isAuthenticated) return;

    let isMounted = true;

    async function startHub(
      url: string,
      ref: React.MutableRefObject<HubConnection | null>,
      setStatus: (s: ConnectionStatus) => void,
      setHub: (h: HubConnection | null) => void
    ) {
      if (ref.current) return; // Already connecting / connected

      const connection = new HubConnectionBuilder()
        .withUrl(url, {
          accessTokenFactory: freshAccessToken,
          withCredentials: true,
        })
        .withAutomaticReconnect(infiniteRetryPolicy)
        .configureLogging(hubLogger)
        .build();

      // Set ref immediately so concurrent calls (StrictMode) hit the guard above.
      ref.current = connection;

      connection.onreconnecting(() => { if (isMounted) setStatus("reconnecting"); });
      connection.onreconnected(() => { if (isMounted) setStatus("connected"); });
      connection.onclose(() => {
        if (isMounted) {
          ref.current = null;
          setHub(null);
          setStatus("disconnected");
        }
      });

      setStatus("connecting");
      try {
        await connection.start();
        if (!isMounted) return;
        setStatus("connected");
        setHub(connection);
      } catch (err) {
        const msg = (err as Error)?.message ?? "";
        if (!msg.includes("stopped during negotiation") && isMounted) {
          console.error("[SignalR] Failed to connect to", url, err);
        }
        if (isMounted) {
          ref.current = null;
          setStatus("disconnected");
        }
      }
    }

    void startHub(CHAT_HUB_URL, chatRef, setChatStatus, setChatHub);
    void startHub(NOTIFICATION_HUB_URL, notifRef, setNotificationStatus, setNotificationHub);

    // Mobiler fryser bakgrundsflikar/låst skärm; efter en längre paus ger
    // withAutomaticReconnect upp (onclose → ref = null) och inget återansluter.
    // Starta om döda hubbar när sidan blir synlig igen istället för att
    // kräva en sidladdning.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!chatRef.current) {
        void startHub(CHAT_HUB_URL, chatRef, setChatStatus, setChatHub);
      }
      if (!notifRef.current) {
        void startHub(NOTIFICATION_HUB_URL, notifRef, setNotificationStatus, setNotificationHub);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", onVisible);

      const chat = chatRef.current;
      const notif = notifRef.current;
      chatRef.current = null;
      notifRef.current = null;

      if (chat && chat.state !== HubConnectionState.Disconnected) {
        chat.stop().catch(() => null);
      }
      if (notif && notif.state !== HubConnectionState.Disconnected) {
        notif.stop().catch(() => null);
      }
    };
  }, [isAuthenticated, isLoading]);

  return (
    <SignalRContext.Provider value={{ chatHub, notificationHub, chatStatus, notificationStatus }}>
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalR(): SignalRContextValue {
  return useContext(SignalRContext);
}
