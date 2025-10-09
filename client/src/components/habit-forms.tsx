import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, Recycle, Zap, Droplets, Trees, Calculator } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateDistance, getDistanceCategory, calculateTransportPoints } from "@/lib/distance";

// Form schemas for different habit types
const transportSchema = z.object({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  description: z.string().optional(),
  image: z.any().optional(),
});

const recycleSchema = z.object({
  recycledItem: z.string().min(1, "Please select or enter the recycled item"),
  description: z.string().optional(),
  image: z.any().refine((files) => files?.length > 0, "Image is required for verification"),
});

const treeSchema = z.object({
  description: z.string().optional(),
  image: z.any().refine((files) => files?.length > 0, "Image is required for verification"),
});

const energyWaterSchema = z.object({
  description: z.string().min(1, "Please describe your action"),
  image: z.any().refine((files) => files?.length > 0, "Image is required for verification"),
});

// Common recycling items for the dropdown
const recyclingItems = [
  "Plastic Bottles", "Glass Bottles", "Aluminum Cans", "Paper/Cardboard",
  "Electronics", "Batteries", "Clothing", "Food Waste", "Metal Items",
  "Plastic Containers", "Newspaper", "Magazines", "Cardboard Boxes"
];

interface HabitFormProps {
  habitType: "transport" | "recycle" | "energy" | "water" | "trees";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function HabitForm({ habitType, isOpen, onClose, onSubmit, isLoading }: HabitFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customItem, setCustomItem] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  const getSchema = () => {
    switch (habitType) {
      case "transport": return transportSchema;
      case "recycle": return recycleSchema;
      case "trees": return treeSchema;
      default: return energyWaterSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: getDefaultValues(),
  });

  function getDefaultValues() {
    switch (habitType) {
      case "transport":
        return { startLocation: "", endLocation: "", description: "" };
      case "recycle":
        return { recycledItem: "", description: "" };
      default:
        return { description: "" };
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", e.target.files);
    }
  };

  const handleSubmit = (data: any) => {
    const formData = {
      ...data,
      habitType,
      imageFile: data.image?.[0], // Pass the actual file
      distance: calculatedDistance, // Include calculated distance for transport
    };
    onSubmit(formData);
  };
  
  const handleDistanceCalculation = () => {
    const startLocation = form.getValues('startLocation');
    const endLocation = form.getValues('endLocation');
    
    if (startLocation && endLocation) {
      const distance = calculateDistance(startLocation, endLocation);
      setCalculatedDistance(distance);
    }
  };

  const getTitle = () => {
    switch (habitType) {
      case "transport": return "Public Transport Usage";
      case "recycle": return "Recycling Action";
      case "trees": return "Tree Planting";
      case "energy": return "Energy Conservation";
      case "water": return "Water Conservation";
      default: return "Eco Action";
    }
  };

  const getIcon = () => {
    switch (habitType) {
      case "transport": return <MapPin className="w-5 h-5" />;
      case "recycle": return <Recycle className="w-5 h-5" />;
      case "trees": return <Trees className="w-5 h-5" />;
      case "energy": return <Zap className="w-5 h-5" />;
      case "water": return <Droplets className="w-5 h-5" />;
      default: return null;
    }
  };

  const getPoints = () => {
    switch (habitType) {
      case "trees": return 5;
      case "energy": return 6;
      case "water": return 4;
      case "recycle": return 5;
      case "transport": return "1-4 (based on distance)";
      default: return 1;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
            <span className="text-sm text-eco-primary">({getPoints()} points)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pb-4">
          {/* Transport specific fields */}
          {habitType === "transport" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startLocation">Start Location</Label>
                <Input
                  id="startLocation"
                  placeholder="Enter your starting point"
                  {...form.register("startLocation")}
                />
                {form.formState.errors.startLocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.startLocation.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endLocation">Destination</Label>
                <Input
                  id="endLocation"
                  placeholder="Enter your destination"
                  {...form.register("endLocation")}
                />
                {form.formState.errors.endLocation && (
                  <p className="text-sm text-red-500">{form.formState.errors.endLocation.message}</p>
                )}
              </div>
              
              {/* Distance Calculation */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDistanceCalculation}
                  className="w-full flex items-center space-x-2"
                  disabled={!form.watch('startLocation') || !form.watch('endLocation')}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Distance</span>
                </Button>
                
                {calculatedDistance && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-800 dark:text-green-200">Estimated Distance:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{calculatedDistance} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700 dark:text-green-300">{getDistanceCategory(calculatedDistance)}</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{calculateTransportPoints(calculatedDistance)} points</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-medium mb-1">Points based on distance:</p>
                <ul className="space-y-1">
                  <li>• 1-5 km: 1 point</li>
                  <li>• 5-10 km: 2 points</li>
                  <li>• 11-20 km: 3 points</li>
                  <li>• 20+ km: 4 points</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">*Distance calculation is estimated. GPS integration coming soon!</p>
              </div>
            </>
          )}

          {/* Recycling specific fields */}
          {habitType === "recycle" && (
            <div className="space-y-2">
              <Label htmlFor="recycledItem">What did you recycle?</Label>
              {!showCustomInput ? (
                <Select
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setShowCustomInput(true);
                    } else {
                      form.setValue("recycledItem", value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item or choose 'Other'" />
                  </SelectTrigger>
                  <SelectContent>
                    {recyclingItems.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                    <SelectItem value="custom">Other (specify)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter the item you recycled"
                    value={customItem}
                    onChange={(e) => {
                      setCustomItem(e.target.value);
                      form.setValue("recycledItem", e.target.value);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomItem("");
                      form.setValue("recycledItem", "");
                    }}
                  >
                    Back
                  </Button>
                </div>
              )}
              {form.formState.errors.recycledItem && (
                <p className="text-sm text-red-500">{form.formState.errors.recycledItem.message}</p>
              )}
            </div>
          )}

          {/* Common description field */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {habitType === "trees" ? "Where did you plant the tree?" : 
               habitType === "energy" ? "What energy conservation action did you take?" :
               habitType === "water" ? "What water conservation action did you take?" :
               "Additional Details (Optional)"}
            </Label>
            <Textarea
              id="description"
              placeholder={
                habitType === "trees" ? "e.g., Planted an oak tree in the local park" :
                habitType === "energy" ? "e.g., Switched to LED bulbs, turned off unused appliances" :
                habitType === "water" ? "e.g., Fixed a leaky faucet, took shorter showers" :
                "Add any additional details about your action"
              }
              {...form.register("description")}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Image upload - required for all except transport */}
          <div className="space-y-2">
            <Label htmlFor="image">
              {habitType === "transport" ? "Photo (Optional)" : "Verification Photo *"}
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                )}
                <span className="text-sm text-muted-foreground">
                  {imagePreview ? "Click to change image" : "Click to upload image"}
                </span>
              </label>
            </div>
            {form.formState.errors.image && (
              <p className="text-sm text-red-500">{form.formState.errors.image.message}</p>
            )}
          </div>

          {habitType !== "transport" && (
            <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              ⚠️ Points will be awarded after image verification by our team.
            </div>
          )}

            <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background border-t border-border mt-4 pt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="eco-gradient-primary">
                {isLoading ? "Submitting..." : "Submit Action"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
