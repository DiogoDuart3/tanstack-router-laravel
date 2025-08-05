import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { chatApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TypingIndicator } from "@/components/typing-indicator";
import echo from "@/lib/echo";

export const Route = createFileRoute("/chat")({
  component: ChatComponent,
});

interface ChatMessage {
  id: number;
  message: string;
  display_name: string;
  sent_at: string;
  is_own: boolean;
}

function ChatComponent() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is authenticated
  const { data: userData } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isAuthenticated = !!userData?.user;

  // Fetch recent messages (no polling - using real-time updates)
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['chat', 'recent'],
    queryFn: chatApi.getRecent,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => {
      setMessage("");
      // Don't need to invalidate queries - real-time updates handle this
      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  // Send typing indicator
  const sendTypingMutation = useMutation({
    mutationFn: chatApi.sendTyping,
  });

  // Real-time message listener
  useEffect(() => {
    const channel = echo.channel('public-chat');
    
    channel.listen('MessageSent', (e: any) => {
      // Add new message to the cache
      queryClient.setQueryData(['chat', 'recent'], (oldData: any) => {
        if (!oldData) return { messages: [e.message] };
        return {
          ...oldData,
          messages: [...oldData.messages, e.message],
        };
      });
    });

    return () => {
      echo.leaveChannel('public-chat');
    };
  }, [queryClient]);

  // Real-time typing indicator listener
  useEffect(() => {
    const channel = echo.channel('public-chat-typing');
    
    channel.listen('UserTyping', (e: any) => {
      const { user, is_typing } = e;
      const currentUser = userData?.user?.name ?? username ?? 'Anonymous';
      
      // Don't show own typing indicator
      if (user.display_name === currentUser) return;
      
      setTypingUsers(prev => {
        if (is_typing) {
          // Add user to typing list if not already there
          return prev.includes(user.display_name) 
            ? prev 
            : [...prev, user.display_name];
        } else {
          // Remove user from typing list
          return prev.filter(name => name !== user.display_name);
        }
      });
    });

    return () => {
      echo.leaveChannel('public-chat-typing');
    };
  }, [userData?.user?.name, username]);

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

  // Auto-scroll to bottom when new messages arrive or typing indicators change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current;
      // Use setTimeout to ensure DOM has updated with new content
      setTimeout(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }, 0);
    }
  }, [messagesData, typingUsers]);

  // Handle typing indicator with debouncing
  const handleTyping = useCallback(() => {
    const currentUser = userData?.user?.name ?? username ?? 'Anonymous';
    
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only send typing start event if not already typing
    if (!isCurrentUserTyping) {
      setIsCurrentUserTyping(true);
      sendTypingMutation.mutate({
        is_typing: true,
        username: !isAuthenticated ? currentUser : undefined,
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
        username: !isAuthenticated ? currentUser : undefined,
      });
    }, 1500);
  }, [sendTypingMutation, userData?.user?.name, username, isAuthenticated, isCurrentUserTyping]);

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
        username: !isAuthenticated ? (username || 'Anonymous') : undefined,
      });
    }

    const payload: { message: string; username?: string } = {
      message: message.trim(),
    };

    if (!isAuthenticated && username.trim()) {
      payload.username = username.trim();
    }

    sendMessageMutation.mutate(payload);
  };

  const messages = messagesData?.messages || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-2 h-[calc(100vh-80px)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Public Chat
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAuthenticated 
              ? `Chatting as ${userData?.user?.name}` 
              : "Join the conversation! You can chat anonymously or sign in."}
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
                  No messages yet. Be the first to say hello! 👋
                </div>
              ) : (
                messages.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.is_own
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.display_name}
                        </span>
                        <span className="text-xs opacity-70">
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
                    userName={typingUsers.length === 1 ? typingUsers[0] : `${typingUsers.length} users`}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0">
            {!isAuthenticated && (
              <div className="mb-3">
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={50}
                  className="max-w-xs"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
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