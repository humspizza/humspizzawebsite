import { useLanguage } from "@/contexts/LanguageContext";

interface PaginationHumProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationHum({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationHumProps) {
  const { language } = useLanguage();
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-first"
        >
          FIRST
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-prev"
        >
          PREV
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'border-2 border-white text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid={`pagination-page-${page}`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-2 text-gray-500">
                {page}
              </span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-next"
        >
          NEXT
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          data-testid="pagination-last"
        >
          LAST
        </button>
      </div>

      <p className="text-sm text-gray-400" data-testid="pagination-info">
        {language === 'vi' 
          ? `Hiển thị ${startItem}-${endItem} trong tổng số ${totalItems} bài viết`
          : `Showing ${startItem}-${endItem} of ${totalItems} articles`
        }
      </p>
    </div>
  );
}
