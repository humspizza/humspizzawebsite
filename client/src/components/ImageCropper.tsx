import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImageFile: File) => void;
  cropType?: 'thumbnail' | 'cover'; // thumbnail = 4:3, cover = 16:9
}

export function ImageCropper({ imageUrl, isOpen, onClose, onCrop, cropType = 'cover' }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropData, setCropData] = useState({
    x: 50,
    y: 50,
    width: 800,
    height: 450, // 16:9 aspect ratio (800/450 = 1.78)
  });

  // Dynamic aspect ratio based on crop type
  const ASPECT_RATIO = cropType === 'thumbnail' ? 4 / 3 : 16 / 9;
  const [imageData, setImageData] = useState({
    naturalWidth: 0,
    naturalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
  });

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      // Use larger container for better quality
      const maxContainerWidth = 900;
      const maxContainerHeight = 700;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let displayWidth, displayHeight;
      
      if (aspectRatio > maxContainerWidth / maxContainerHeight) {
        // Image is wider - constrain by width
        displayWidth = Math.min(maxContainerWidth, img.naturalWidth * 0.8);
        displayHeight = displayWidth / aspectRatio;
      } else {
        // Image is taller - constrain by height
        displayHeight = Math.min(maxContainerHeight, img.naturalHeight * 0.8);
        displayWidth = displayHeight * aspectRatio;
      }
      
      setImageData({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: displayWidth,
        displayHeight: displayHeight,
      });

      // Set initial crop with correct aspect ratio, centered
      let initialWidth, initialHeight;
      
      if (displayWidth / displayHeight > ASPECT_RATIO) {
        // Image is wider than target ratio, fit by height
        initialHeight = Math.min(displayHeight * 0.8, displayHeight);
        initialWidth = initialHeight * ASPECT_RATIO;
      } else {
        // Image is taller than target ratio, fit by width  
        initialWidth = Math.min(displayWidth * 0.8, displayWidth);
        initialHeight = initialWidth / ASPECT_RATIO;
      }
      
      setCropData({
        x: (displayWidth - initialWidth) / 2,
        y: (displayHeight - initialHeight) / 2,
        width: initialWidth,
        height: initialHeight,
      });
    }
  }, []);

  const handleCrop = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scale factor from display to natural size
    const scaleX = imageData.naturalWidth / imageData.displayWidth;
    const scaleY = imageData.naturalHeight / imageData.displayHeight;

    // Set canvas size to match crop area exactly
    const outputWidth = Math.round(cropData.width * scaleX);
    const outputHeight = Math.round(cropData.height * scaleY);
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Draw cropped image
    ctx.drawImage(
      imageRef.current,
      Math.round(cropData.x * scaleX),
      Math.round(cropData.y * scaleY),
      Math.round(cropData.width * scaleX),
      Math.round(cropData.height * scaleY),
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCrop(croppedFile);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [cropData, imageData, onCrop, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'move' | 'resize', corner?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStart({ x, y });
    
    if (action === 'move') {
      setIsDragging(true);
    } else if (action === 'resize' && corner) {
      setIsResizing(true);
      setResizeCorner(corner);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current || (!isDragging && !isResizing)) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is way outside image bounds - only stop if very far away
    if (x < -100 || y < -100 || x > rect.width + 100 || y > rect.height + 100) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner('');
      return;
    }
    
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(prev.x + deltaX, imageData.displayWidth - prev.width)),
        y: Math.max(0, Math.min(prev.y + deltaY, imageData.displayHeight - prev.height)),
      }));
      
      setDragStart({ x, y });
    } else if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setCropData(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = prev.x;
        let newY = prev.y;
        
        // Calculate size change based on corner - simplified and more responsive
        switch (resizeCorner) {
          case 'se':
            // Use primary direction for more responsive feel
            const seDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
            newWidth = Math.max(20, prev.width + seDelta);
            newHeight = newWidth / ASPECT_RATIO;
            break;
          case 'nw':
            const nwDelta = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : -deltaY;
            newWidth = Math.max(20, prev.width + nwDelta);
            newHeight = newWidth / ASPECT_RATIO;
            newX = prev.x + prev.width - newWidth;
            newY = prev.y + prev.height - newHeight;
            break;
          case 'ne':
            const neDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY;
            newWidth = Math.max(20, prev.width + neDelta);
            newHeight = newWidth / ASPECT_RATIO;
            newY = prev.y + prev.height - newHeight;
            break;
          case 'sw':
            const swDelta = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : deltaY;
            newWidth = Math.max(20, prev.width + swDelta);
            newHeight = newWidth / ASPECT_RATIO;
            newX = prev.x + prev.width - newWidth;
            break;
            
          case 'n':
          case 's':
            // For vertical resize, calculate width from height to maintain aspect ratio
            if (resizeCorner === 's') {
              newHeight = Math.max(20 / ASPECT_RATIO, prev.height + deltaY);
            } else {
              newHeight = Math.max(20 / ASPECT_RATIO, prev.height - deltaY);
              newY = prev.y + prev.height - newHeight;
            }
            newWidth = newHeight * ASPECT_RATIO;
            newX = prev.x + (prev.width - newWidth) / 2; // Center horizontally
            break;
            
          case 'w':
          case 'e':
            // For horizontal resize, calculate height from width to maintain aspect ratio
            if (resizeCorner === 'e') {
              newWidth = Math.max(20, prev.width + deltaX);
            } else {
              newWidth = Math.max(20, prev.width - deltaX);
              newX = prev.x + prev.width - newWidth;
            }
            newHeight = newWidth / ASPECT_RATIO;
            newY = prev.y + (prev.height - newHeight) / 2; // Center vertically
            break;
        }
        
        // Ensure crop area stays within image bounds - simplified
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
          newHeight = newWidth / ASPECT_RATIO;
        }
        
        if (newY < 0) {
          newHeight += newY;
          newY = 0;
          newWidth = newHeight * ASPECT_RATIO;
        }
        
        if (newX + newWidth > imageData.displayWidth) {
          newWidth = imageData.displayWidth - newX;
          newHeight = newWidth / ASPECT_RATIO;
        }
        
        if (newY + newHeight > imageData.displayHeight) {
          newHeight = imageData.displayHeight - newY;
          newWidth = newHeight * ASPECT_RATIO;
        }
        
        return {
          x: Math.max(0, Math.min(newX, imageData.displayWidth - newWidth)),
          y: Math.max(0, Math.min(newY, imageData.displayHeight - newHeight)),
          width: newWidth,
          height: newHeight,
        };
      });
      
      setDragStart({ x, y });
    }
  }, [isDragging, isResizing, dragStart, resizeCorner, imageData]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner('');
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        e.preventDefault();
        
        // Check if mouse is still within reasonable bounds of image
        if (imageRef.current) {
          const rect = imageRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Stop only if mouse goes very far outside image bounds
          if (x < -150 || y < -150 || x > rect.width + 150 || y > rect.height + 150) {
            setIsDragging(false);
            setIsResizing(false);
            setResizeCorner('');
            return;
          }
        }
        
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleMouseUp();
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {cropType === 'thumbnail' ? 'Cắt Ảnh Thu Nhỏ' : 'Cắt Ảnh Bìa'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Kéo khung màu vàng để thay đổi vị trí. Kéo các điểm màu vàng để thay đổi kích thước (tỷ lệ {cropType === 'thumbnail' ? '4:3' : '16:9'} cố định).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Main Crop Interface */}
          <div className="flex justify-center">
            <div className="relative inline-block bg-zinc-800 p-4 rounded-lg">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                className="max-w-full block select-none"
                style={{ width: imageData.displayWidth || 'auto', height: imageData.displayHeight || 'auto' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  // Only stop if we're not actively dragging/resizing
                  // This prevents interruption during fast movements
                }}
                draggable={false}
              />
              
              {/* Crop Overlay */}
              <div
                ref={cropAreaRef}
                className="absolute border-2 border-primary bg-primary/10 cursor-move select-none"
                style={{
                  left: cropData.x + 16, // Account for padding
                  top: cropData.y + 16,
                  width: cropData.width,
                  height: cropData.height,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Corner Resize Handles */}
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -top-2 -left-2 cursor-nw-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -top-2 -right-2 cursor-ne-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -bottom-2 -left-2 cursor-sw-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -bottom-2 -right-2 cursor-se-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
                />
                
                {/* Edge Resize Handles */}
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -top-2 cursor-n-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -bottom-2 cursor-s-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -left-2 cursor-w-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}
                />
                <div 
                  className="absolute w-4 h-4 bg-primary rounded-full -right-2 cursor-e-resize border-2 border-zinc-900 hover:scale-110 transition-transform"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                  onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}
                />
              </div>
            </div>
          </div>

          {/* Crop Info */}
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <h3 className="text-primary text-sm font-medium mb-2">Kích thước khung cắt:</h3>
            <p className="text-zinc-400 text-sm">
              Kích thước: {Math.round(cropData.width)} × {Math.round(cropData.height)} pixels (Tỷ lệ {cropType === 'thumbnail' ? '4:3' : '16:9'})
            </p>
            
            <div className="mt-4 space-y-2 text-xs text-zinc-400">
              <h4 className="text-primary">Hướng dẫn:</h4>
              <ul className="space-y-1">
                <li>• Kéo khung màu vàng để di chuyển vị trí cắt</li>
                <li>• Kéo các điểm vàng để thay đổi kích thước (luôn giữ tỷ lệ {cropType === 'thumbnail' ? '4:3' : '16:9'})</li>
                <li>• {cropType === 'thumbnail' ? 'Ảnh thu nhỏ hiển thị trong danh sách tin tức' : 'Ảnh bìa hiển thị ở đầu bài viết'}</li>
                <li>• Kích thước khuyến nghị: {cropType === 'thumbnail' ? '800×600px hoặc 1200×900px' : '1920×1080px hoặc 1600×900px'}</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCrop}
              className="bg-primary hover:bg-primary/90 text-zinc-900 font-medium"
            >
              Cắt Ảnh
            </Button>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}