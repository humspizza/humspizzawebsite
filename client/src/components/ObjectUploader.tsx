import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  uploadEndpoint?: string; // Local upload endpoint
  onComplete?: (result: {
    successful: Array<{ uploadURL: string }>;
    failed?: Array<{ error: any }>;
  }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that opens the native file dialog directly.
 * Uploads files to local server via FormData.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  uploadEndpoint = "/api/upload-image",
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
      // Upload file via FormData
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookie
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      onComplete?.({
        successful: [{ uploadURL: data.url }]
      });

    } catch (error) {
      console.error('Upload error:', error);
      onComplete?.({
        successful: [],
        failed: [{ error }]
      });
      
      toast({
        title: "Lỗi tải lên",
        description: error instanceof Error ? error.message : "Không thể tải file lên",
        variant: "destructive",
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