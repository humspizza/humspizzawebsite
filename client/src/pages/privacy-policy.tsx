import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">{t('privacy.title')}</h1>
          <p className="text-xl text-gray-300">
            {t('privacy.lastUpdated')}: {t('privacy.date')}
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section1.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('privacy.section1.content1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section1.content2')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section2.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('privacy.section2.content1')}
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• {t('privacy.section2.item1')}</li>
              <li>• {t('privacy.section2.item2')}</li>
              <li>• {t('privacy.section2.item3')}</li>
              <li>• {t('privacy.section2.item4')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section3.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('privacy.section3.content1')}
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• {t('privacy.section3.item1')}</li>
              <li>• {t('privacy.section3.item2')}</li>
              <li>• {t('privacy.section3.item3')}</li>
              <li>• {t('privacy.section3.item4')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section4.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section4.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section5.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section5.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('privacy.section6.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('privacy.section6.content1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong>{t('privacy.contact.email')}:</strong> support@humspizza.com<br />
              <strong>{t('privacy.contact.phone')}:</strong> 0934 699 798<br />
              <strong>{t('privacy.contact.address')}:</strong> {t('footer.addressLine1')}, {t('footer.addressLine2')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}