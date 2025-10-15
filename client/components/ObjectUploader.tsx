import React, { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * - Supports file size and type restrictions
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 2MB for OG images)
 * @param props.allowedFileTypes - Array of allowed MIME types (default: image formats)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.disabled - Whether the upload button is disabled
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default for Open Graph images
  allowedFileTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
      .on("upload-error", (file, error) => {
        console.error("Upload error:", error);
      })
  );

  const handleOpenModal = () => {
    if (!disabled) {
      setShowModal(true);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Button 
        onClick={handleOpenModal} 
        className={buttonClassName}
        disabled={disabled}
        data-testid="button-upload-image"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={`Tối đa ${formatFileSize(maxFileSize)} • Định dạng: ${allowedFileTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`}
        metaFields={[]}
        showProgressDetails={true}
        showRemoveButtonAfterComplete={true}
        closeModalOnClickOutside={true}
        disableLocalFiles={false}
      />
    </div>
  );
}

/**
 * Specialized component for Open Graph image uploads with predefined restrictions
 */
export function OGImageUploader({
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: Omit<ObjectUploaderProps, 'maxNumberOfFiles' | 'maxFileSize' | 'allowedFileTypes'>) {
  return (
    <ObjectUploader
      maxNumberOfFiles={1}
      maxFileSize={2097152} // 2MB - optimal for Open Graph images
      allowedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
      onGetUploadParameters={onGetUploadParameters}
      onComplete={onComplete}
      buttonClassName={buttonClassName}
      disabled={disabled}
    >
      {children}
    </ObjectUploader>
  );
}