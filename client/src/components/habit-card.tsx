import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface HabitCardProps {
  habitType: 'recycle' | 'transport' | 'energy' | 'water' | 'trees';
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number | string;
  count: number;
  gradientClass: string;
  buttonClass: string;
  countColor: string;
  onIncrement: () => void;
}

export default function HabitCard({
  habitType,
  title,
  description,
  icon,
  points,
  count,
  gradientClass,
  buttonClass,
  countColor,
  onIncrement
}: HabitCardProps) {
  const getCountLabel = () => {
    switch (habitType) {
      case 'recycle':
        return "Items Recycled";
      case 'transport':
        return "Trips Taken";
      case 'energy':
        return "Actions Taken";
      case 'water':
        return "Actions Taken";
      case 'trees':
        return "Trees Planted";
      default:
        return "Count";
    }
  };

  const getButtonLabel = () => {
    switch (habitType) {
      case 'recycle':
        return "Log Recycling";
      case 'transport':
        return "Log Trip";
      case 'energy':
        return "Log Action";
      case 'water':
        return "Log Action";
      case 'trees':
        return "Log Tree Planted";
      default:
        return "Log Action";
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100">
      <div className={`${gradientClass} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          {icon}
          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
            +{points} points
          </span>
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">{getCountLabel()}</span>
          <span className={`text-2xl font-bold ${countColor}`}>{count}</span>
        </div>
        <Button
          onClick={onIncrement}
          className={`w-full ${buttonClass} text-white py-3 rounded-xl font-semibold transition-colors duration-200`}
        >
          <Plus className="mr-2" />
          {getButtonLabel()}
        </Button>
      </CardContent>
    </Card>
  );
}
