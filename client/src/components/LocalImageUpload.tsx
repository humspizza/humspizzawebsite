import { useState, useRef, useCallback } from 'react';
import { Upload, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageCropper } from './ImageCropper';

interface LocalImageUploadProps {
  onFileUploaded: (url: string) => void;
  onMultipleUploaded?: (urls: string[]) => void;
  uploadEndpoint: string; // e.g., '/api/news-images/upload'
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
  currentImage?: string;
  className?: string;
  cropType?: 'thumbnail' | 'cover' | 'none'; // thumbnail = 4:3, cover = 16:9, none = no crop
  allowMultiple?: boolean;
}

export function LocalImageUpload({
  onFileUploaded,
  onMultipleUploaded,
  uploadEndpoint,
  accept = "image/*",
  maxSize = 10,
  placeholder = "Kéo thả ảnh vào đây hoặc click để chọn file",
  currentImage,
  className = "",
  cropType = 'none',
  allowMultiple = false,
}: LocalImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (allowMultiple && files.length > 1) {
        handleMultipleFileUpload(files);
      } else {
        handleFileUpload(files[0]);
      }
    }
  }, [allowMultiple]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (allowMultiple && fileArray.length > 1) {
        handleMultipleFileUpload(fileArray);
      } else {
        handleFileUpload(fileArray[0]);
      }
    }
  }, [allowMultiple]);

  const handleMultipleFileUpload = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onFileUploaded('ERROR:Chỉ được upload file ảnh');
        continue;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        onFileUploaded(`ERROR:File ${file.name} vượt quá ${maxSize}MB`);
        continue;
      }

      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const result = await response.json();
        uploadedUrls.push(result.url);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        onFileUploaded(`ERROR:${errorMessage}`);
      }
    }

    setIsUploading(false);

    // Notify parent with all uploaded URLs
    if (uploadedUrls.length > 0 && onMultipleUploaded) {
      onMultipleUploaded(uploadedUrls);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onFileUploaded('ERROR:Chỉ được upload file ảnh');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onFileUploaded(`ERROR:File không được vượt quá ${maxSize}MB`);
      return;
    }

    // For images with crop enabled, show cropper first
    if (cropType !== 'none') {
      const preview = URL.createObjectURL(file);
      setPendingImageUrl(preview);
      setShowCropper(true);
      return;
    }

    // For regular uploads
    await processUpload(file);
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload file using FormData
      const formData = new FormData();
      formData.append('image', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      const uploadResult = await new Promise<{ url: string }>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid server response'));
              }
            } else {
              const errorText = xhr.responseText || xhr.statusText;
              reject(new Error(`Upload failed: ${errorText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.onabort = () => reject(new Error('Upload was aborted'));
        
        xhr.open('POST', uploadEndpoint);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);
      });

      // Update preview to real URL and notify parent
      setPreviewUrl(uploadResult.url);
      onFileUploaded(uploadResult.url);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      onFileUploaded(`ERROR:${errorMessage}`);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCrop = async (croppedFile: File) => {
    setShowCropper(false);
    setPendingImageUrl(null);
    await processUpload(croppedFile);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    onFileUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          multiple={allowMultiple}
        />
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
            ${isDragging 
              ? 'border-yellow-500 bg-yellow-500/10' 
              : 'border-zinc-600 hover:border-zinc-500'
            }
            ${isUploading ? 'pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
                style={{ aspectRatio: '16/9' }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearImage();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="mb-2">Đang upload...</div>
                    <div className="w-32 bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-sm mt-1">{Math.round(uploadProgress)}%</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              {isUploading ? (
                <div className="space-y-3">
                  <div className="text-yellow-500">
                    <Upload className="w-8 h-8 mx-auto animate-pulse" />
                  </div>
                  <div className="text-white">Đang upload...</div>
                  <div className="w-32 bg-zinc-700 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-zinc-400">{Math.round(uploadProgress)}%</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-zinc-400">
                    <Upload className="w-8 h-8 mx-auto" />
                  </div>
                  <div className="text-zinc-300">{placeholder}</div>
                  <div className="text-sm text-zinc-500">
                    Hỗ trợ: JPG, PNG, WebP (tối đa {maxSize}MB)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Crop button */}
          {cropType !== 'none' && previewUrl && !isUploading && (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPendingImageUrl(previewUrl);
                setShowCropper(true);
              }}
              size="sm"
              className="absolute bottom-2 left-2 bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Scissors className="w-4 h-4 mr-1" />
              Cắt Ảnh
            </Button>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && pendingImageUrl && (
        <ImageCropper
          imageUrl={pendingImageUrl}
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setPendingImageUrl(null);
          }}
          onCrop={handleCrop}
          cropType={cropType === 'none' ? 'cover' : cropType}
        />
      )}
    </>
  );
}
