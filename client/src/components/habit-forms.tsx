import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, Recycle, Droplets, Trees, Calculator, Navigation } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateDistance, getDistanceCategory, calculateTransportPoints } from "@/lib/distance";
import { validateRecyclingImage, RECYCLING_IMAGE_GUIDELINES } from "@/lib/image-validation";
import { resizeImageForHabit } from "@/lib/image-compression";

// Form schemas for different habit types
const baseHabitSchema = z.object({
  description: z.string().optional(),
  image: z.instanceof(File).optional(), // Expect a single File object
  recycledItem: z.string().optional(),
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
});

const transportSchema = baseHabitSchema.extend({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
});

const recycleSchema = baseHabitSchema.extend({
  recycledItem: z.string().min(1, "Please select or enter the recycled item"),
  image: z.instanceof(File, { message: "Image is required for verification" }),
});

const treeSchema = baseHabitSchema.extend({
  image: z.instanceof(File, { message: "Image is required for verification" }),
});

const energyWaterSchema = baseHabitSchema.extend({
  description: z.string().min(1, "Please describe your action"),
  image: z.instanceof(File, { message: "Image is required for verification" }),
});

// Common recycling items for the dropdown
const recyclingItems = [
  "Plastic Bottles", "Glass Bottles", "Aluminum Cans", "Paper/Cardboard",
  "Electronics", "Batteries", "Clothing", "Food Waste", "Metal Items",
  "Plastic Containers", "Newspaper", "Magazines", "Cardboard Boxes"
];

interface HabitFormProps {
  habitType: "transport" | "recycle" | "water" | "trees";
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
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [imageValidation, setImageValidation] = useState<{errors: string[], warnings: string[]} | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(getSchema(habitType)),
    defaultValues: getDefaultValues(habitType),
  });

  function getSchema(type: HabitFormProps['habitType']) {
    switch (type) {
      case "transport": return transportSchema;
      case "recycle": return recycleSchema;
      case "trees": return treeSchema;
      case "water": return energyWaterSchema;
      default: return baseHabitSchema;
    }
  }

  function getDefaultValues(type: HabitFormProps['habitType']) {
    // All fields are optional in the base schema, so we can safely return undefined for all
    // and let the specific schemas handle the 'required' validation.
    return {
      startLocation: undefined,
      endLocation: undefined,
      description: undefined,
      recycledItem: undefined,
      image: undefined,
    };
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", file as any); // Set the single file, casting to any to bypass TS error
      
      // Validate image if it's for recycling
      if (habitType === 'recycle') {
        setIsValidatingImage(true);
        try {
          const validation = await validateRecyclingImage(file);
          setImageValidation({
            errors: validation.errors,
            warnings: validation.warnings
          });
        } catch (error) {
          console.error('Image validation error:', error);
          setImageValidation({
            errors: [],
            warnings: ['Unable to validate image. Please ensure it clearly shows recyclable items.']
          });
        }
        setIsValidatingImage(false);
      }
    } else {
      setImageValidation(null);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let compressedImageUrl = null;
      
      if (data.image) { // data.image is now a single File object
        // Compress image before submission
        compressedImageUrl = await resizeImageForHabit(data.image);
      }
      
      const formData = {
        ...data,
        habitType,
        imageFile: data.image, // Keep original file for potential fallback
        imageUrl: compressedImageUrl, // Use compressed image
        distance: habitType === 'transport' ? (calculatedDistance || 0) : 0, // Ensure distance is always a number
      };
      
      onSubmit(formData);
    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback to original submission without compression
      const formData = {
        ...data,
        habitType,
        imageFile: data.image,
        distance: habitType === 'transport' ? (calculatedDistance || 0) : 0, // Ensure distance is always a number
      };
      onSubmit(formData);
    }
  };
  
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          // Auto-fill current location as start location, only if habitType is transport
          if (habitType === 'transport') {
            form.setValue('startLocation', `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` as any);
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please ensure location permissions are enabled.');
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
    }
  };
  
  const calculateDistanceFromCoords = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };
  
  const handleDistanceCalculation = () => {
    // Ensure startLocation and endLocation are strings, defaulting to empty if undefined
    const startLocation = form.getValues('startLocation') || '';
    const endLocation = form.getValues('endLocation') || '';
    
    // Check if locations are coordinates (lat, lng format)
    const coordRegex = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (coordRegex.test(startLocation) && coordRegex.test(endLocation)) {
      const [startLat, startLng] = startLocation.split(',').map(coord => parseFloat(coord.trim()));
      const [endLat, endLng] = endLocation.split(',').map(coord => parseFloat(coord.trim()));
      const distance = calculateDistanceFromCoords(startLat, startLng, endLat, endLng);
      setCalculatedDistance(Math.round(distance * 10) / 10); // Round to 1 decimal place
    } else {
      // Fallback to the existing method for text-based locations
      const distance = calculateDistance(startLocation, endLocation);
      setCalculatedDistance(distance);
    }
  };

  const getTitle = () => {
    switch (habitType) {
      case "transport": return "Public Transport Usage";
      case "recycle": return "Recycling Action";
      case "trees": return "Tree Planting";
      case "water": return "Water Conservation";
      default: return "Eco Action";
    }
  };

  const getIcon = () => {
    switch (habitType) {
      case "transport": return <MapPin className="w-5 h-5" />;
      case "recycle": return <Recycle className="w-5 h-5" />;
      case "trees": return <Trees className="w-5 h-5" />;
      case "water": return <Droplets className="w-5 h-5" />;
      default: return null;
    }
  };

  const getPoints = () => {
    switch (habitType) {
      case "trees": return 5;
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
          <form onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }} className="space-y-4 pb-4">
          {/* Transport specific fields */}
          {habitType === "transport" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startLocation">Start Location</Label>
                <div className="flex space-x-2">
                  <Input
                    id="startLocation"
                    placeholder="Enter starting point or use GPS"
                    {...form.register("startLocation")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center space-x-2 min-w-fit"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isGettingLocation ? 'Getting...' : 'GPS'}</span>
                  </Button>
                </div>
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
                <p className="text-xs mt-2 text-muted-foreground">💡 Use GPS for your start location, then enter destination coordinates or address for accurate distance calculation!</p>
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
                    if (habitType === "recycle") { // Only set recycledItem for recycle habit
                      if (value === "custom") {
                        setShowCustomInput(true);
                      } else {
                        form.setValue("recycledItem", value as any);
                      }
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
                      if (habitType === "recycle") { // Only set recycledItem for recycle habit
                        form.setValue("recycledItem", e.target.value as any);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomItem("");
                      if (habitType === "recycle") { // Only clear recycledItem for recycle habit
                        form.setValue("recycledItem", undefined as any); // Set to undefined instead of empty string
                      }
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
               habitType === "water" ? "What water conservation action did you take?" :
               "Additional Details (Optional)"}
            </Label>
            <Textarea
              id="description"
              placeholder={
                habitType === "trees" ? "e.g., Planted an oak tree in the local park" :
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
                {...form.register("image")}
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
            
            {/* Image validation feedback */}
            {isValidatingImage && (
              <div className="text-sm text-blue-500 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Validating image...</span>
              </div>
            )}
            
            {imageValidation && (
              <div className="space-y-2">
                {imageValidation.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Image Issues:</div>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {imageValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {imageValidation.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Suggestions:</div>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {imageValidation.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Guidelines for recycling images */}
            {habitType === 'recycle' && !imagePreview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📸 Photo Guidelines:</div>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  {RECYCLING_IMAGE_GUIDELINES.slice(0, 4).map((guideline, index) => (
                    <li key={index}>{guideline}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            ⚠️ {habitType === "transport" 
              ? "Upload a photo showing you in the public vehicle for verification." 
              : "Points are awarded immediately upon successful upload."}
          </div>

            <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background border-t border-border mt-4 pt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isValidatingImage || (imageValidation?.errors.length ?? 0) > 0} 
                className="eco-gradient-primary"
              >
                {isLoading ? "Submitting..." : "Submit Action"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
