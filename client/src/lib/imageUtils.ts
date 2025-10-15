/**
 * Format image URL to be absolute and production-ready
 * Converts /objects/images/... to full URL with proper extension
 */
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a local asset path (/api/assets/...), return as is
  if (url.startsWith('/api/assets/')) {
    return url;
  }
  
  // If it's an object storage path (/objects/images/...)
  if (url.startsWith('/objects/')) {
    // Get the base URL (protocol + domain)
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    
    // Check if URL has extension
    const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    
    // Add .jpg extension if missing
    const finalUrl = hasExtension ? url : `${url}.jpg`;
    
    return `${baseUrl}${finalUrl}`;
  }
  
  // For any other relative path, make it absolute
  if (url.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    return `${baseUrl}${url}`;
  }
  
  return url;
}

/**
 * Get background-image style with formatted URL
 */
export function getBackgroundImageStyle(url: string | null | undefined) {
  const formattedUrl = formatImageUrl(url);
  return formattedUrl ? { backgroundImage: `url('${formattedUrl}')` } : {};
}
