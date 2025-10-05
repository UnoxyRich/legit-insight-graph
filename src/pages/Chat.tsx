import { useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

type Policy = {
  id: string;
  title: string;
  jurisdiction: string;
  status: string;
  lastAction: string;
  confidence: number;
  matchedSections: string[];
  messageId: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          mode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start AI stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let fullContent = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // Add policy cards for describe mode
      if (mode === "describe") {
        setTimeout(() => {
          setPolicies((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              title: "Affordable Care Act",
              jurisdiction: "Federal",
              status: "Active",
              lastAction: "Amendment vote - Passed",
              confidence: 94,
              year: 2010,
              matchedSections: [
                "Section 1201(4) - Marketplace establishment",
                "Section 1302 - Essential health benefits",
                "Section 1311 - State flexibility",
              ],
              messageId: assistantMessageId,
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, there was an error processing your request.", isStreaming: false }
            : msg
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  Legislative Transparency
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Policy Research</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ModeSelector mode={mode} onModeChange={setMode} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 mb-8 shadow-large">
                  <Search className="h-16 w-16 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-4xl font-serif font-bold text-foreground mb-4 tracking-tight">
                Ask about legislation
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-6">
                Search policies, track changes, and understand who influences
                the laws that affect you
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Bill tracking
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Amendment history
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Sponsor analysis
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Lobbying data
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage message={message} />
                  {/* Show policy cards after this assistant message */}
                  {message.role === "assistant" && !message.isStreaming && (
                    <div className="mt-4 space-y-3">
                      {policies
                        .filter((p) => p.messageId === message.id)
                        .map((policy) => (
                          <PolicyCard key={policy.id} policy={policy} />
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div className="border-t border-border bg-card/95 backdrop-blur-md shadow-large">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <ChatInput
            onSend={handleSendMessage}
            disabled={messages.some((m) => m.isStreaming)}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
