import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl?: string;
  fileName?: string;
  displayName: string;
  fileSize?: string;
  lastModified?: string;
  exists: boolean;
  isPending?: boolean;
}

export function VideoPreview({
  videoUrl,
  displayName,
  fileSize,
  lastModified,
  exists,
  isPending = false
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(0);
  const [cacheBustTime, setCacheBustTime] = useState(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousVideoData = useRef({ videoUrl, fileSize, lastModified });

  // Update cache bust time when video URL, fileSize, or lastModified changes
  useEffect(() => {
    const current = { videoUrl, fileSize, lastModified };
    const previous = previousVideoData.current;
    
    if (current.videoUrl !== previous.videoUrl || 
        current.fileSize !== previous.fileSize || 
        current.lastModified !== previous.lastModified) {
      
      setCacheBustTime(Date.now());
      previousVideoData.current = current;
      
      // Force video element to reload
      const video = videoRef.current;
      if (video) {
        video.load();
      }
    }
  }, [videoUrl, fileSize, lastModified]);

  // Add cache busting to video URL to ensure fresh content
  const cacheBustedVideoUrl = videoUrl ? `${videoUrl}?t=${cacheBustTime}` : undefined;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
      }
    };
  }, []);

  // Handle preview auto-stop
  const stopPreview = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsPlaying(false);
    setPreviewTimeLeft(0);
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  // Start 5-second preview
  const startPreview = async () => {
    const video = videoRef.current;
    if (video) {
      try {
        video.currentTime = 0;
        await video.play();
        setIsPlaying(true);
        setPreviewTimeLeft(5);
        
        // Start countdown timer
        previewTimerRef.current = setInterval(() => {
          setPreviewTimeLeft(prev => {
            if (prev <= 1) {
              stopPreview();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Auto-stop after 5 seconds
        setTimeout(() => {
          stopPreview();
        }, 5000);
      } catch (error) {
        // Video play interrupted - no logging needed
        // Reset state if play fails
        setIsPlaying(false);
        setPreviewTimeLeft(0);
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-medium">{displayName}</h4>
      </div>
      
      {exists ? (
        <>
          <div className="space-y-2 text-sm text-muted-foreground mb-3">
            <p><strong>Kích thước:</strong> {fileSize}</p>
            <p><strong>Cập nhật:</strong> {lastModified ? new Date(lastModified).toLocaleString('vi-VN') : 'N/A'}</p>
          </div>

          {cacheBustedVideoUrl && (
            <>
              {/* Video Preview */}
              <video
                ref={videoRef}
                src={cacheBustedVideoUrl}
                className="w-full h-32 object-cover rounded-lg mb-3"
                onError={(e) => {
                  // For pending videos from object storage, try to show a placeholder or handle gracefully
                  if (isPending) {
                    // Expected error for pending object storage URLs
                    return;
                  }
                  console.error(`Video error:`, e);
                }}
                muted
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
              />

              {/* Preview Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={startPreview}
                  disabled={isPlaying}
                  className="gap-1"
                >
                  {isPlaying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Dừng sau {previewTimeLeft}s</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Xem (5s)</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có video</p>
      )}
    </Card>
  );
}