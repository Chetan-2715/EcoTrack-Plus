import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  startLocation: z.string().min(1, "Starting location is required"),
  endLocation: z.string().min(1, "Destination is required"),
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
  
  const calculateDistance = async (startLocation: string, endLocation: string) => {
    try {
      // First, geocode the addresses to get coordinates using OpenRouteService Geocoding
      const geocodeUrl = 'https://api.openrouteservice.org/geocode/search';
      
      // Access environment variable in a way that works with Vite
      const apiKey = import.meta.env.VITE_ORS_API_KEY;
      
      if (!apiKey) {
        console.error('OpenRouteService API key is not configured. Please add VITE_ORS_API_KEY to your .env file');
        throw new Error('OpenRouteService API key is not configured. Please check your configuration.');
      }
      
      // Geocode start location
      const startResponse = await fetch(
        `${geocodeUrl}?api_key=${apiKey}&text=${encodeURIComponent(startLocation)}`
      );
      
      // Geocode end location
      const endResponse = await fetch(
        `${geocodeUrl}?api_key=${apiKey}&text=${encodeURIComponent(endLocation)}`
      );
      
      const startData = await startResponse.json();
      const endData = await endResponse.json();
      
      if (!startData.features?.length || !endData.features?.length) {
        throw new Error('Could not find coordinates for one or both locations');
      }
      
      const startCoords = startData.features[0].geometry.coordinates; // [lng, lat]
      const endCoords = endData.features[0].geometry.coordinates;     // [lng, lat]
      
      // Calculate route using OpenRouteService Directions API
      const directionsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
      const directionsResponse = await fetch(directionsUrl, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [startCoords, endCoords],
          instructions: false,
          preference: 'recommended',
          units: 'km'
        })
      });
      
      const routeData = await directionsResponse.json();
      
      if (routeData.routes?.length) {
        // Return distance in kilometers (ORS returns km by default when units=km)
        return routeData.routes[0].summary.distance;
      } else {
        throw new Error('Could not calculate route');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw new Error('Failed to calculate distance. Please check the addresses and try again.');
    }
  };
  
  // Helper function to calculate distance between two points using Haversine formula
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleCalculateDistance = async () => {
    // Get values with proper type assertion
    const startLocation = form.getValues('startLocation') as string;
    const endLocation = form.getValues('endLocation') as string;
    
    if (!startLocation || !endLocation) {
      form.setError('startLocation', { type: 'manual', message: 'Both locations are required' });
      return;
    }
    
    try {
      setIsGettingLocation(true);
      
      // Check if we have the OpenRouteService API key
      if (!import.meta.env.VITE_ORS_API_KEY) {
        throw new Error('OpenRouteService API key is not configured. Please add VITE_ORS_API_KEY to your .env file');
      }

      try {
        // First try with OpenRouteService
        const distance = await calculateDistance(startLocation, endLocation);
        setCalculatedDistance(parseFloat(distance.toFixed(2)));
      } catch (apiError) {
        console.error('OpenRouteService error:', apiError);
        
        // Fallback to Haversine formula only if the inputs are coordinates
        const coordRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
        const isStartCoord = coordRegex.test(startLocation);
        const isEndCoord = coordRegex.test(endLocation);
        
        if (isStartCoord && isEndCoord) {
          const parseCoordinate = (coord: string): [number, number] => {
            const [lat, lng] = coord.split(',').map(Number);
            return [lat, lng];
          };
          
          const [startLat, startLng] = parseCoordinate(startLocation);
          const [endLat, endLng] = parseCoordinate(endLocation);
          
          const distance = haversineDistance(startLat, startLng, endLat, endLng);
          setCalculatedDistance(parseFloat(distance.toFixed(2)));
        } else {
          throw new Error('Failed to calculate distance. Please check your API key and ensure the addresses are valid.');
        }
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      form.setError('startLocation', { 
        type: 'manual', 
        message: error instanceof Error ? error.message : 'Failed to calculate distance' 
      });
    } finally {
      setIsGettingLocation(false);
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
          <DialogDescription>
            Log your eco-friendly action to earn points and track your impact.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }} className="space-y-4 pb-4">
          {/* Transport specific fields */}
          {habitType === "transport" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="startLocation">Starting Point</Label>
                <Input
                  id="startLocation"
                  placeholder="e.g., 123 Main St, New York, NY"
                  {...form.register('startLocation')}
                  className="mt-1"
                />
                {form.formState.errors?.startLocation && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.startLocation.message as string}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="endLocation">Destination</Label>
                <Input
                  id="endLocation"
                  placeholder="e.g., 456 Oak Ave, Boston, MA"
                  {...form.register('endLocation')}
                  className="mt-1"
                />
                {form.formState.errors?.endLocation && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.endLocation.message as string}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <Button 
                  type="button" 
                  onClick={handleCalculateDistance}
                  disabled={isGettingLocation}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {isGettingLocation ? 'Calculating...' : 'Calculate Distance'}
                </Button>
                
                {calculatedDistance !== null && (
                  <div className="text-sm bg-muted px-3 py-1.5 rounded-md">
                    Distance: <span className="font-medium text-foreground">{calculatedDistance} km</span>
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
                <p className="text-xs mt-2 text-muted-foreground">💡 Enter start and destination addresses for accurate distance calculation!</p>
              </div>
            </div>
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

            <div className="flex justify-end space-x-2 sticky bottom-0 bg-background border-t border-border mt-4 -mx-6 px-6 pt-4">
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
