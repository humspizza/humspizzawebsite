import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'vi' ? 'Không Tìm Thấy Trang' : 'Page Not Found'}
          </h2>
          <p className="text-lg text-gray-300 mb-2">
            {language === 'vi' 
              ? 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.'
              : 'The page you are looking for does not exist or has been moved.'
            }
          </p>
          <p className="text-gray-400">
            {language === 'vi'
              ? 'Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.'
              : 'Please check the URL or return to the homepage.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
