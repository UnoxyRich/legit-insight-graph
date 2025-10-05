import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (confidence >= 75) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <Card className="shadow-medium hover:shadow-large transition-all border-2 hover:border-primary/50">
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

        <Button
          onClick={() => navigate(`/transparency/${policy.id}`)}
          className="w-full shadow-medium hover:shadow-large transition-all"
          size="lg"
        >
          View Transparency Graph
        </Button>
      </CardContent>
    </Card>
  );
};
