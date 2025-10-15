import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: {
    successful: Array<{ uploadURL: string }>;
    failed?: Array<{ error: any }>;
  }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that opens the native file dialog directly.
 * No complex modal interface, just click and select files from your computer.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      toast({
        title: "File quá lớn",
        description: `Kích thước file không được vượt quá ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Check file type - allow both images and videos
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Định dạng file không hợp lệ",
        description: "Chỉ chấp nhận file hình ảnh (JPG, PNG, WEBP) hoặc video (MP4, WEBM)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Get upload URL
      const { url } = await onGetUploadParameters();
      
      // Upload file
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Call completion callback with normalized URL
      const objectStorageService = { normalizeObjectEntityPath: (rawPath: string) => {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        
        // Extract bucket and object path
        const pathParts = rawObjectPath.split("/");
        if (pathParts.length < 3) return rawObjectPath;
        
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join("/");
        
        // Check if it's in private directory
        if (objectName.startsWith(".private/")) {
          const entityId = objectName.replace(".private/", "");
          return `/objects/${entityId}`;
        }
        
        return rawObjectPath;
      }};
      
      const normalizedURL = objectStorageService.normalizeObjectEntityPath(url.split('?')[0]);
      
      onComplete?.({
        successful: [{ uploadURL: normalizedURL }]
      });

    } catch (error) {
      console.error('Upload error:', error);
      onComplete?.({
        successful: [],
        failed: [{ error }]
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-file-upload"
      />
      <Button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }} 
        className={buttonClassName}
        disabled={uploading}
        data-testid="button-upload-image"
      >
        {uploading ? "Đang tải lên..." : children}
      </Button>
    </div>
  );
}