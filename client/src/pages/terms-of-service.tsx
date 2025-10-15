import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsOfService() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">{t('terms.title')}</h1>
          <p className="text-xl text-gray-300">
            {t('terms.lastUpdated')}: {t('terms.date')}
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('terms.section1.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('terms.section1.content1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section1.content2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('terms.section2.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('terms.section2.content1')}
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• {t('terms.section2.item1')}</li>
              <li>• {t('terms.section2.item2')}</li>
              <li>• {t('terms.section2.item3')}</li>
              <li>• {t('terms.section2.item4')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('terms.section3.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section3.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('terms.section4.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section4.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('terms.section5.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('terms.section5.content1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong>{t('terms.contact.email')}:</strong> support@humspizza.com<br />
              <strong>{t('terms.contact.phone')}:</strong> 0934 699 798<br />
              <strong>{t('terms.contact.address')}:</strong> {t('footer.addressLine1')}, {t('footer.addressLine2')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}