import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface VideoUploaderProps {
  maxFileSize?: number;
  onComplete?: (result: { success: boolean; fileName?: string; message?: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  videoType: 'hero' | 'reservation'; // Type of hero video
}

const API_BASE = "/api";

async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * A specialized video uploader component for hero videos.
 * Uploads video to object storage then copies it to attached_assets for immediate use.
 */
export function VideoUploader({
  maxFileSize = 209715200, // 200MB default for videos
  onComplete,
  buttonClassName,
  children,
  videoType,
}: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Save video mutation
  const saveVideoMutation = useMutation({
    mutationFn: async ({ videoUrl, videoType }: { videoUrl: string; videoType: string }) => {
      return apiRequest("/save-hero-video", {
        method: "POST",
        body: JSON.stringify({ videoUrl, videoType }),
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      toast({
        title: "File quá lớn",
        description: `Kích thước video không được vượt quá ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Check file type - only videos
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Định dạng file không hợp lệ",
        description: "Chỉ chấp nhận file video (MP4, WEBM, MOV)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload file via FormData
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch('/api/upload-hero-video', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookie
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();

      // Save the video to pending state
      const result = await saveVideoMutation.mutateAsync({
        videoUrl: data.url,
        videoType,
      });

      toast({
        title: "Video đã được tải lên!",
        description: result.message || "Video sẽ áp dụng khi bấm 'Lưu thay đổi' bên dưới.",
        duration: 5000,
      });

      onComplete?.({
        success: true,
        fileName: result.fileName,
        message: result.message,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Có lỗi xảy ra khi tải lên video",
        variant: "destructive",
      });
      onComplete?.({
        success: false,
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
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-video-upload"
      />
      <Button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }} 
        className={buttonClassName}
        disabled={uploading || saveVideoMutation.isPending}
        data-testid={`button-upload-${videoType}-video`}
      >
        {(uploading || saveVideoMutation.isPending) ? "Đang tải lên..." : children}
      </Button>
    </div>
  );
}