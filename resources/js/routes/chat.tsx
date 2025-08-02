import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { chatApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated
  const { data: userData } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isAuthenticated = !!userData?.user;

  // Fetch recent messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['chat', 'recent'],
    queryFn: chatApi.getRecent,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['chat', 'recent'] });
      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

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
                onChange={(e) => setMessage(e.target.value)}
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