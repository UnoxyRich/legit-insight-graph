import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  mode: "describe" | "troubleshoot";
};

export const ChatInput = ({ onSend, disabled, mode }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholder =
    mode === "describe"
      ? "Ask about a bill, policy, or legislative change..."
      : "Need help finding something? Ask for search tips...";

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] pr-14 resize-none shadow-medium border-2 focus-visible:border-primary transition-colors"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || disabled}
        className="absolute right-3 bottom-3 rounded-full shadow-medium hover:shadow-large transition-all"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};
