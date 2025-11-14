import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

export const SensorCard = ({ title, value, unit, icon, trend }: SensorCardProps) => {
  return (
    <Card className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold glow-text">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className="text-primary p-3 bg-primary/10 rounded-lg">
          {icon || <Activity className="h-6 w-6" />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Status: <span className="text-accent font-medium">{trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable"}</span>
          </span>
        </div>
      )}
    </Card>
  );
};