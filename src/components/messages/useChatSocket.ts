"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  senderId?: string;
  createdAt?: string;
  content?: string;
  fileUrls?: string[];
  roomId?: string;
  user1Id?: string;
  user2Id?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  online?: boolean;
  selected?: boolean;
  roomId?: string;
  unreadCount?: number;
  partner?: any;
}

interface UseChatSocketProps {
  token: string;
  userId: string;
}

export function useChatSocket({ token, userId }: UseChatSocketProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [isConnecting, setIsConnecting] = useState(false);

  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const hasConnectedRef = useRef(false);
  const hasAutoSelectedRef = useRef(false);

  // Debug userId
  console.log("🔍 useChatSocket initialized with userId:", userId, "type:", typeof userId);

  // Scroll helper
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  
  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    setIsConnecting(true);
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(
        `wss://app.playspark.us?x-token=${encodeURIComponent(token)}`
      );

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnecting(false);
        setConnectionStatus("connected");
        hasConnectedRef.current = true;

        // Request conversations
        ws.send(JSON.stringify({ type: "conversation" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "conversation") {
            const formattedContacts: Contact[] = data.conversations
              .filter((conv: any) => conv.partner?.id)
              .map((conv: any) => ({
                id: conv.partner.id,
                name: conv.partner.fullName || "Unknown",
                avatar: conv.partner.profileImage || "/placeholder.svg",
                lastMessage: conv.lastMessage?.content || "No messages yet",
                time: conv.lastMessage?.createdAt
                  ? new Date(conv.lastMessage.createdAt).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  : "Just now",
                online: conv.partner.isActive,
                roomId: conv.roomId,
                unreadCount: conv.unreadCount || 0,
                partner: conv.partner,
              }));

            setContacts(formattedContacts);

            if (
              formattedContacts.length > 0 &&
              !selectedContact &&
              !hasAutoSelectedRef.current
            ) {
              const firstContact = formattedContacts[0];
              setSelectedContact(firstContact);
              hasAutoSelectedRef.current = true;
              
              // Subscribe to first contact to load past messages
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "subscribe", receiverId: firstContact.id }));
              }
            }
          }

          if (data.type === "past-messages") {
            console.log("📦 Past messages received:", data.messages?.length, "messages");
            console.log("🔍 Current userId for comparison:", userId, "type:", typeof userId);
            
            const pastMessages: Message[] = (data.messages || []).map(
              (msg: any, index: number) => {
                // Try all possible sender ID fields and normalize to string
                const senderId = String(msg.senderId || msg.user1Id || msg.sender?.id || msg.from || "");
                const user1Id = String(msg.user1Id || "");
                const user2Id = String(msg.user2Id || "");
                const normalizedUserId = String(userId || "");
                
                // Check if current user sent this message - try multiple conditions
                const isSent = senderId === normalizedUserId || 
                               user1Id === normalizedUserId ||
                               msg.sender?.id === normalizedUserId;
                
                // Debug every message to understand the structure
                console.log(`Message ${index}:`, {
                  rawSenderId: msg.senderId,
                  rawUser1Id: msg.user1Id,
                  rawUser2Id: msg.user2Id,
                  senderId,
                  user1Id,
                  user2Id,
                  normalizedUserId,
                  isSent,
                  content: msg.content?.substring(0, 20)
                });
                
                return {
                  id: `${msg.roomId}-${msg.id || msg._id || index}`,
                  text: msg.content || "",
                  timestamp: msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now",
                  isSent,
                  senderId,
                  createdAt: msg.createdAt,
                  content: msg.content,
                  fileUrls: msg.fileUrl || [],
                  roomId: msg.roomId,
                  user1Id: msg.user1Id,
                  user2Id: msg.user2Id,
                };
              }
            );

            console.log("✅ Processed messages with isSent flags:", pastMessages.map(m => ({
              content: m.content?.substring(0, 20),
              isSent: m.isSent,
              senderId: m.senderId
            })));

            setMessages(pastMessages.reverse());
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }

          if (data.type === "message" || data.content || data.senderId) {
            const msgId = data.id || data._id || Date.now();
            const uniqueId = `${data.roomId}-${msgId}`;
            
            // Normalize IDs to strings for comparison
            const senderId = String(data.senderId || data.user1Id || data.sender?.id || "");
            const normalizedUserId = String(userId || "");
            const isSent = senderId === normalizedUserId || 
                          String(data.user1Id) === normalizedUserId;

            console.log("📨 New real-time message:", {
              senderId,
              normalizedUserId,
              isSent,
              content: data.content?.substring(0, 20)
            });

            const newMessage: Message = {
              id: uniqueId,
              text: data.content || "",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isSent,
              senderId,
              createdAt: data.createdAt,
              content: data.content,
              fileUrls: data.fileUrl || [],
              roomId: data.roomId,
              user1Id: data.user1Id,
              user2Id: data.user2Id,
            };

            setMessages((prev) => {
              // Avoid duplicates including optimistic messages
              const isDuplicate = prev.some((msg) => 
                msg.id === newMessage.id || 
                (msg.content === newMessage.content && 
                 msg.isSent === newMessage.isSent && 
                 Math.abs(new Date(msg.createdAt || msg.timestamp).getTime() - Date.now()) < 5000)
              );
              
              if (isDuplicate) return prev;
              return [...prev, newMessage];
            });

            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        } catch (err) {
          console.error("WebSocket parsing error:", err);
        }
      };

      ws.onerror = () => {
        setIsConnecting(false);
        setConnectionStatus("error");
        if (!reconnectRef.current) {
          reconnectRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnecting(false);
        setConnectionStatus("disconnected");

        if (event.code !== 1000 && !reconnectRef.current) {
          reconnectRef.current = setTimeout(connectWebSocket, 5000);
        }
      };

      webSocketRef.current = ws;
    } catch (error) {
      console.error("WebSocket failed:", error);
      setIsConnecting(false);
      setConnectionStatus("error");
    }
  }, [token, userId]);


  // Single effect to initialize WebSocket
  useEffect(() => {
    if (!token) {
      console.warn("No token provided for WebSocket connection");
      return;
    }
    
    connectWebSocket();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };
  }, [token]);


  // Subscribe to selected contact
  const subscribeContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setMessages([]);
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({ type: "subscribe", receiverId: contact.id })
      );
    }

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id
          ? { ...c, selected: true, unreadCount: 0 }
          : { ...c, selected: false }
      )
    );
  }, []);

  // Send message function
  const sendMessage = useCallback((content: string, fileUrls: string[] = []) => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Connection lost. Please wait...");
      return false;
    }

    if (!selectedContact) {
      toast.error("No contact selected");
      return false;
    }

    if (!content.trim() && fileUrls.length === 0) {
      toast.error("Message cannot be empty");
      return false;
    }

    // Create optimistic message - show immediately in UI before server confirms
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      text: content.trim(),
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSent: true,
      senderId: userId,
      createdAt: new Date().toISOString(),
      fileUrls: fileUrls,
      roomId: selectedContact.roomId,
      user1Id: userId,
      user2Id: selectedContact.id,
    };

    // Add to UI immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    // Send to server
    const messageData = {
      type: "send-message",
      receiverId: selectedContact.id,
      content: content.trim(),
      fileUrl: fileUrls,
    };
    
    webSocketRef.current.send(JSON.stringify(messageData));
    return true;
  }, [selectedContact, userId]);

  return {
    contacts,
    selectedContact,
    messages,
    connectionStatus,
    isConnecting,
    subscribeContact,
    sendMessage,
    setMessages,
    webSocketRef,
    messagesEndRef,
  };
}
