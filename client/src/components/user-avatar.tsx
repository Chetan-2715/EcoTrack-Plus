import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { resizeImageForAvatar } from "@/lib/image-compression";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showEdit?: boolean;
  onAvatarChange?: (newAvatarUrl: string) => void;
  className?: string;
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  size = "md", 
  showEdit = false, 
  onAvatarChange,
  className = ""
}: UserAvatarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-20 h-20 text-lg",
    xl: "w-32 h-32 text-2xl"
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (selectedFile && onAvatarChange) {
      try {
        // Compress and resize the image before saving
        const compressedDataUrl = await resizeImageForAvatar(selectedFile);
        onAvatarChange(compressedDataUrl);
        setIsDialogOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (error) {
        console.error('Error compressing avatar image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onload = () => {
          onAvatarChange(reader.result as string);
          setIsDialogOpen(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleAvatarClick = () => {
    if (showEdit) {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white relative ${className} ${showEdit ? 'cursor-pointer' : ''}`}
        onClick={handleAvatarClick}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className={`w-full h-full rounded-full flex items-center justify-center ${getAvatarColor(username)}`}>
            {getInitials(username)}
          </div>
        )}
        
        {showEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(username)} text-white text-2xl font-semibold`}>
                    {getInitials(username)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground text-center">
                JPEG, PNG, or GIF up to 2MB
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAvatar} 
                disabled={!selectedFile}
                className="eco-gradient-primary text-white"
              >
                Save Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
