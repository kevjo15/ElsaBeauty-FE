let audioContext: AudioContext | null = null;
let audioUnlocked = false;
let audioUnlockListenersAttached = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }
  return audioContext;
}

function attachAudioUnlockListeners(): void {
  if (typeof window === "undefined" || audioUnlockListenersAttached) return;
  audioUnlockListenersAttached = true;

  const unlock = async () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioUnlocked = ctx.state === "running";
    } catch {
      audioUnlocked = false;
    }

    if (audioUnlocked) {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audioUnlockListenersAttached = false;
    }
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

/**
 * Play a notification sound
 */
export const playNotificationSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!audioUnlocked) {
      attachAudioUnlockListeners();
      if (ctx.state !== "running") return;
      audioUnlocked = true;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.frequency.value = 1000;
    oscillator2.type = "sine";

    gainNode2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    oscillator2.start(ctx.currentTime + 0.15);
    oscillator2.stop(ctx.currentTime + 0.25);
  } catch {
    // Notification sound is best-effort only.
  }
};

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

/**
 * Show a browser notification
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
};

/**
 * Check if notifications are supported and enabled
 */
export const areNotificationsEnabled = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};
