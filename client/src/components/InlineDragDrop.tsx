import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageCropper } from './ImageCropper';

interface InlineDragDropProps {
  onFileUploaded: (url: string) => void;
  onGetUploadUrl: () => Promise<string>;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
  currentImage?: string;
  className?: string;
  cropType?: 'thumbnail' | 'cover' | 'none'; // thumbnail = 4:3, cover = 16:9, none = no crop
  isContentImage?: boolean; // For content images to append to end
  allowMultiple?: boolean; // For multiple file upload
  onMultipleUploaded?: (urls: string[]) => void; // Callback for multiple files
}

export function InlineDragDrop({
  onFileUploaded,
  onGetUploadUrl,
  accept = "image/*",
  maxSize = 5,
  placeholder = "Kéo thả ảnh vào đây hoặc click để chọn file",
  currentImage,
  className = "",
  cropType = 'none',
  isContentImage = false,
  allowMultiple = false,
  onMultipleUploaded
}: InlineDragDropProps) {
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
      if (allowMultiple && files.length > 1) {
        handleMultipleFileUpload(Array.from(files));
      } else {
        handleFileUpload(files[0]);
      }
    }
  }, [allowMultiple]);

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

    // For regular uploads or content images
    await processUpload(file);
  };

  const handleMultipleFileUpload = async (files: File[]) => {
    // Check if too many files selected
    if (files.length > 5) {
      onFileUploaded(`ERROR:Chỉ được chọn tối đa 5 ảnh. Bạn đã chọn ${files.length} ảnh.`);
      return;
    }

    // Set uploading state
    setIsUploading(true);
    setUploadProgress(0);

    const urls: string[] = [];
    let uploadedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress
      setUploadProgress(((i) / files.length) * 100);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onFileUploaded(`ERROR:File ${file.name} không phải là ảnh`);
        errorCount++;
        continue;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        onFileUploaded(`ERROR:File ${file.name} vượt quá ${maxSize}MB`);
        errorCount++;
        continue;
      }

      try {
        const url = await processSingleUpload(file);
        if (url) {
          urls.push(url);
          uploadedCount++;
        }
      } catch (error) {
        // Error uploading file
        onFileUploaded(`ERROR:Upload ${file.name} thất bại`);
        errorCount++;
      }
    }
    
    // Complete upload
    setUploadProgress(100);
    setIsUploading(false);
    setUploadProgress(0);
    
    if (urls.length > 0 && onMultipleUploaded) {
      onMultipleUploaded(urls);
    }
    
    // Show success message for multiple uploads
    if (uploadedCount > 0) {
      onFileUploaded(`SUCCESS:Đã upload thành công ${uploadedCount} ảnh${errorCount > 0 ? ` (${errorCount} ảnh lỗi)` : ''}`);
    }
  };

  const processSingleUpload = async (file: File): Promise<string | null> => {
    try {
      // Get upload URL from backend
      let uploadUrl;
      try {
        uploadUrl = await onGetUploadUrl();
      } catch (error: any) {
        // Handle authentication or network errors
        if (error.message && error.message.includes('401')) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          throw new Error('Không thể kết nối đến server. Vui lòng thử lại.');
        }
      }
      
      // Upload file
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Extract object path
      const urlPath = new URL(uploadUrl).pathname;
      const pathParts = urlPath.split('/');
      const privateIndex = pathParts.indexOf('.private');
      
      if (privateIndex >= 0 && privateIndex < pathParts.length - 2) {
        const remainingParts = pathParts.slice(privateIndex + 1);
        return `/objects/${remainingParts.join('/')}`;
      }
      
      return null;
    } catch (error) {
      // Upload error handled
      return null;
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Get upload URL from backend
      let uploadUrl;
      try {
        uploadUrl = await onGetUploadUrl();
      } catch (error: any) {
        // Handle authentication or network errors
        setIsUploading(false);
        setUploadProgress(0);
        if (error.message && error.message.includes('401')) {
          onFileUploaded('ERROR:Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          onFileUploaded('ERROR:Không thể kết nối đến server. Vui lòng thử lại.');
        }
        return;
      }
      
      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                // Extract the object path from upload URL
                const urlPath = new URL(uploadUrl).pathname;
                // Upload URL path extracted
                
                // Handle different path structures:
                // New format: /replit-objstore-xxx/.private/images/uuid
                // Old format: /.private/uploads/uuid
                const pathParts = urlPath.split('/');
                // Path parts analyzed
                
                let objectPath = '';
                
                // Look for .private directory in path
                const privateIndex = pathParts.indexOf('.private');
                if (privateIndex >= 0 && privateIndex < pathParts.length - 2) {
                  // Extract from .private onwards: .private/images/uuid -> /objects/images/uuid
                  const remainingParts = pathParts.slice(privateIndex + 1);
                  objectPath = `/objects/${remainingParts.join('/')}`;
                } else {
                  // Fallback: look for uploads directory
                  const uploadsIndex = pathParts.indexOf('uploads');
                  if (uploadsIndex > 0) {
                    objectPath = `/objects/${pathParts.slice(uploadsIndex).join('/')}`;
                  } else {
                    // Upload path structure error
                    reject(new Error('Invalid upload path structure'));
                    return;
                  }
                }
                
                // Final object path generated
                
                if (isContentImage) {
                  // For content images, trigger special handling to append to end
                  onFileUploaded(`APPEND_TO_END:${objectPath}`);
                } else {
                  onFileUploaded(objectPath);
                }
                resolve();
              } catch (error) {
                // Error processing upload response
                reject(error);
              }
            } else {
              // Upload failed with status
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = (e) => {
          // Upload error
          reject(new Error('Upload network error'));
        };
        
        xhr.onabort = () => {
          // Upload aborted
          reject(new Error('Upload was aborted'));
        };
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

    } catch (error) {
      // Upload error handled
      alert(`Upload thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}. Vui lòng thử lại.`);
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
          multiple={allowMultiple}
          onChange={handleFileSelect}
          className="hidden"
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
                  <div className="mb-2">{allowMultiple ? "Đang upload nhiều ảnh..." : "Đang upload..."}</div>
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
                <div className="text-white">{allowMultiple ? "Đang upload nhiều ảnh..." : "Đang upload..."}</div>
                <div className="w-32 bg-zinc-700 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-sm text-zinc-400">{Math.round(uploadProgress)}%</div>
                {allowMultiple && (
                  <div className="text-xs text-zinc-500">Đang xử lý từng ảnh...</div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-zinc-400">
                  <Upload className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-zinc-300">
                  {allowMultiple ? "Kéo thả nhiều ảnh vào đây hoặc click để chọn" : placeholder}
                </div>
                <div className="text-sm text-zinc-500">
                  Hỗ trợ: JPG, PNG, WebP (tối đa {maxSize}MB)<br/>
                  {allowMultiple && "Tối đa 5 ảnh/lần upload"}<br/>
                  Khuyến nghị: Tỉ lệ 16:9 (1920x1080px hoặc 1600x900px)
                </div>
              </div>
            )}
          </div>
        )}

          {/* Crop button for images */}
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