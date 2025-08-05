import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { adminChatApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Shield, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TypingIndicator } from "@/components/typing-indicator";
import echo from "@/lib/echo";

export const Route = createFileRoute("/admin-chat")({
  component: AdminChatComponent,
});

interface AdminChatMessage {
  id: number;
  message: string;
  display_name: string;
  sent_at: string;
  is_own: boolean;
}

function AdminChatComponent() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is authenticated and is admin
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isAuthenticated = !!userData?.user;
  const isAdmin = userData?.user?.is_admin;

  // Redirect if not admin
  useEffect(() => {
    if (!isUserLoading && (!isAuthenticated || !isAdmin)) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isAdmin, isUserLoading]);

  // Fetch recent messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['admin-chat', 'recent'],
    queryFn: adminChatApi.getRecent,
    enabled: isAuthenticated && isAdmin,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: adminChatApi.sendMessage,
    onSuccess: () => {
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  // Send typing indicator
  const sendTypingMutation = useMutation({
    mutationFn: adminChatApi.sendTyping,
  });

  // Real-time message listener
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const channel = echo.channel('admin-chat');
    
    channel.listen('AdminMessageSent', (e: any) => {
      queryClient.setQueryData(['admin-chat', 'recent'], (oldData: any) => {
        if (!oldData) return { messages: [e.message] };
        return {
          ...oldData,
          messages: [...oldData.messages, e.message],
        };
      });
    });

    return () => {
      echo.leaveChannel('admin-chat');
    };
  }, [queryClient, isAuthenticated, isAdmin]);

  // Real-time typing indicator listener
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const channel = echo.channel('admin-chat-typing');
    
    channel.listen('AdminUserTyping', (e: any) => {
      const { user, is_typing } = e;
      const currentUser = userData?.user?.name;
      
      // Don't show own typing indicator
      if (user.display_name === currentUser) return;
      
      setTypingUsers(prev => {
        if (is_typing) {
          return prev.includes(user.display_name) 
            ? prev 
            : [...prev, user.display_name];
        } else {
          return prev.filter(name => name !== user.display_name);
        }
      });
    });

    return () => {
      echo.leaveChannel('admin-chat-typing');
    };
  }, [userData?.user?.name, isAuthenticated, isAdmin]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      // Find the viewport element inside the ScrollArea
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        // Use setTimeout to ensure DOM has updated with new content
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 0);
      }
    }
  }, [messagesData, typingUsers]);

  // Handle typing indicator with debouncing
  const handleTyping = useCallback(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only send typing start event if not already typing
    if (!isCurrentUserTyping) {
      setIsCurrentUserTyping(true);
      sendTypingMutation.mutate({
        is_typing: true,
      });
    }

    // Clear existing stop-typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Debounce the stop-typing event
    debounceTimeoutRef.current = setTimeout(() => {
      setIsCurrentUserTyping(false);
      sendTypingMutation.mutate({
        is_typing: false,
      });
    }, 800);
  }, [sendTypingMutation, isCurrentUserTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Clear all typing timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Send stop typing indicator if currently typing
    if (isCurrentUserTyping) {
      setIsCurrentUserTyping(false);
      sendTypingMutation.mutate({
        is_typing: false,
      });
    }

    sendMessageMutation.mutate({
      message: message.trim(),
    });
  };

  // Show loading or redirect if not authorized
  if (isUserLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-2 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-2 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin privileges required to access this chat.</p>
        </div>
      </div>
    );
  }

  const messages = messagesData?.messages || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-2 h-[calc(100vh-80px)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <MessageCircle className="h-5 w-5" />
            Admin Chat
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Private chat channel for administrators only. Chatting as {userData?.user?.name}
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
            <div className="space-y-3 p-2">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No admin messages yet. Start the conversation! 🔒
                </div>
              ) : (
                messages.map((msg: AdminChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.is_own
                          ? 'bg-orange-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {msg.display_name}
                        </span>
                        <span className={`text-xs ${msg.is_own ? 'text-orange-100' : 'opacity-70'}`}>
                          {formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="px-2">
                  <TypingIndicator
                    isTyping={true}
                    userName={typingUsers.length === 1 ? typingUsers[0] : `${typingUsers.length} admins`}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0">            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type your admin message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (e.target.value.trim()) {
                    handleTyping();
                  }
                }}
                maxLength={1000}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {sendMessageMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              Failed to send message. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}