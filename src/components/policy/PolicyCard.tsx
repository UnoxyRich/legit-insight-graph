import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Clock, MapPin, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Policy = {
  id: string;
  title: string;
  jurisdiction: string;
  status: string;
  lastAction: string;
  confidence: number;
  matchedSections: string[];
  year?: number; // Year of policy enactment
};

type PolicyCardProps = {
  policy: Policy;
};

export const PolicyCard = ({ policy }: PolicyCardProps) => {
  const navigate = useNavigate();
  const fontClass = policy.year && policy.year < 2000 ? "font-classic" : "font-modern";
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (confidence >= 75) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: `About ${policy.title}: ${userMessage}` }],
          mode: "describe",
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to start AI stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
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
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setChatMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = fullContent;
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, there was an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative shadow-medium hover:shadow-large transition-all border-2 hover:border-primary/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className={`text-xl font-semibold text-foreground ${fontClass}`}>
                {policy.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {policy.jurisdiction}
              </Badge>
              <Badge variant={policy.status === "Active" ? "default" : "secondary"}>
                {policy.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>{policy.lastAction}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-border">
            <TrendingUp
              className={`h-4 w-4 ${getConfidenceColor(policy.confidence)}`}
            />
            <span
              className={`text-sm font-bold ${getConfidenceColor(
                policy.confidence
              )}`}
            >
              {policy.confidence}%
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-foreground">
            Top matched sections:
          </p>
          <ul className="space-y-1">
            {policy.matchedSections.map((section, idx) => (
              <li
                key={idx}
                className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0"
              >
                {section}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/transparency/${policy.id}`)}
            className="flex-1 shadow-medium hover:shadow-large transition-all"
            size="lg"
          >
            View Transparency Graph
          </Button>
          <Button
            onClick={() => setShowChat(true)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </CardContent>

      {showChat && (
        <div className="absolute inset-0 bg-card/98 backdrop-blur-md border-2 border-primary rounded-lg shadow-large z-10 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Ask about {policy.title}
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Ask any question about this policy
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground shadow-soft" 
                    : "bg-muted text-foreground border border-border shadow-soft"
                }`}>
                  <div className="text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content.replace(/\*/g, '')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2 pt-3 border-t border-border">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="default" disabled={isLoading || !chatInput.trim()}>
              Send
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
};
