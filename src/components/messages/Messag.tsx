"use client";

// import { useChatSocket } from "./useChatSocket";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, ImageIcon, Search, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useGenerateUrlMutation } from "@/redux/api/messageApi";
import Image from "next/image";
import { useChatSocket } from "./useChatSocket";

export function Message({ token, userId }: { token: string; userId: string }) {
  const {
    contacts,
    selectedContact,
    messages,
    connectionStatus,
    isConnecting,
    subscribeContact,
    sendMessage: sendWebSocketMessage,
    messagesEndRef,
  } = useChatSocket({ token, userId });

  const [inputMessage, setInputMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generateUrlFn] = useGenerateUrlMutation();

  const sendMessage = async () => {
    if (!selectedContact) {
      toast.error("No contact selected");
      return;
    }
    
    if (!inputMessage.trim() && files.length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      let fileUrls: string[] = [];

      // Upload files if any
      if (files.length > 0) {
        setIsUploading(true);
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        try {
          const result = await generateUrlFn(formData).unwrap();
          if (result.success && result.result) {
            fileUrls = result.result;
          } else {
            toast.error("Failed to upload files");
            setIsUploading(false);
            return;
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload files");
          setIsUploading(false);
          return;
        }
      }

      // Send via WebSocket
      const sent = sendWebSocketMessage(inputMessage, fileUrls);
      
      if (sent) {
        setInputMessage("");
        setFiles([]);
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validFiles = newFiles.filter((file) => {
        if (file.size > maxSize) {
          toast.error(`${file.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} file(s) selected`);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  console.log({messages})

  return (
    <div className="flex h-full w-full bg-[#191919] overflow-hidden">
      {/* Connection Status Indicator */}
      {connectionStatus !== "connected" && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-zinc-800/90 border border-zinc-700 rounded-lg px-4 py-2 backdrop-blur-sm">
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              <span className="text-sm text-yellow-500">Connecting...</span>
            </>
          ) : connectionStatus === "error" ? (
            <>
              <div className="h-4 w-4 rounded-full bg-red-500" />
              <span className="text-sm text-red-400">Connection Error</span>
            </>
          ) : (
            <>
              <div className="h-4 w-4 rounded-full bg-orange-500" />
              <span className="text-sm text-orange-400">Disconnected</span>
            </>
          )}
        </div>
      )}

      {/* Contacts Sidebar */}
      <div className="flex flex-col w-[350px] border-r border-[#3D3D3D]">
        <div className="p-6 pt-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search contacts..."
              className="pl-11 bg-[#1a1a1a] border-[#3D3D3D] text-white rounded-full h-12 placeholder:text-zinc-500 focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isConnecting && contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mb-4" />
              <p className="text-zinc-400 text-center">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-zinc-400 text-center">No conversations yet</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => subscribeContact(contact)}
                className={`flex items-center gap-4 px-6 py-5 cursor-pointer border-b border-[#3D3D3D] transition-colors ${
                  contact.selected ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-white/10">
                    <AvatarImage src={contact.avatar} className="object-cover" />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  {contact.online && (
                    <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#121212] bg-green-500" />
                  )}
                  {(contact.unreadCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {contact.unreadCount! > 9 ? "9+" : contact.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[14px] font-semibold text-white truncate">
                      {contact.name}
                    </h3>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase">
                      {contact.time}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 truncate font-medium">
                    {contact.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-[#3D3D3D] bg-[#191919] px-8 py-6">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src={selectedContact.avatar} className="object-cover" />
                <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {selectedContact.name}
                </h2>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      selectedContact.online
                        ? "bg-green-500 animate-pulse"
                        : "bg-zinc-500"
                    }`}
                  />
                  <span className="text-[12px] font-semibold text-zinc-400">
                    {selectedContact.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">
                    Start a conversation with {selectedContact.name}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.isSent
                          ? "bg-[#eb5e9d] text-white"
                          : "bg-[#1c1c1c] text-zinc-200 border border-[#3D3D3D]"
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      {
                        msg.fileUrls && msg.fileUrls.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.fileUrls.map((url, index) => (
                              <Image key={index} src={url} width={200} height={200}   alt={`attachment-${index}`} className="max-w-full rounded-lg" />
                            ))}
                          </div>
                        )
                      }
                      <span className="text-[10px] opacity-70 mt-1 block">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#3D3D3D] bg-[#191919] p-6">
              {/* File Previews */}
              {files.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-zinc-300 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 max-w-5xl mx-auto">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-400 border border-[#3D3D3D] transition-colors hover:text-white hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach files"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </button>

                <input
                  type="text"
                  className="flex-1 rounded-full border border-[#3D3D3D] bg-[#151515] py-4 px-5 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-zinc-600 focus:bg-[#1a1a1a] transition-all duration-300"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isUploading}
                />
                
                <button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && files.length === 0) || isUploading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title="Send message"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 rotate-45" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4">
            {isConnecting ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg">Connecting to chat server...</p>
              </>
            ) : contacts.length === 0 ? (
              <>
                <p className="text-lg mb-2">Welcome to Messages</p>
                <p className="text-center">Start a new conversation</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">Select a conversation</p>
                <p className="text-sm">Click on any contact to start messaging</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
