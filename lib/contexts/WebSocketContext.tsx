"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "@/lib/api/auth/utils";
import type { NotificationResponse } from "@/types/lms";

type WebSocketContextType = {
  isConnected: boolean;
  latestNotifications: NotificationResponse[];
  clearNotifications: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<
    NotificationResponse[]
  >([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("WebSocketContext: running");

    const token = getAccessToken();

    console.log("WebSocketContext: token exists?", !!token);

    if (!token) {
      console.log("WebSocketContext: NO TOKEN, returning");
      return;
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const wsBase = apiBase.replace(/^http/, "ws");
    const brokerURL = `${wsBase}/ws`;

    console.log("API BASE:", process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log("WebSocket URL:", brokerURL);

    const client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe("/user/queue/notifications", (message) => {
          try {
            const notification: NotificationResponse = JSON.parse(message.body);

            setLatestNotifications((prev) =>
              [notification, ...prev].slice(0, 50),
            );
          } catch {
            // Ignore malformed messages
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setLatestNotifications([]);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, latestNotifications, clearNotifications }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
