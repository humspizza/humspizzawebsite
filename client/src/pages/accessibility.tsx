import { useLanguage } from "@/contexts/LanguageContext";

export default function Accessibility() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">{t('accessibility.title')}</h1>
          <p className="text-xl text-gray-300">
            {t('accessibility.lastUpdated')}: {t('accessibility.date')}
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('accessibility.section1.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('accessibility.section1.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('accessibility.section2.title')}</h2>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• {t('accessibility.section2.item1')}</li>
              <li>• {t('accessibility.section2.item2')}</li>
              <li>• {t('accessibility.section2.item3')}</li>
              <li>• {t('accessibility.section2.item4')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('accessibility.section3.title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('accessibility.section3.content')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-6 text-primary">{t('accessibility.section4.title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('accessibility.section4.content1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong>{t('accessibility.contact.email')}:</strong> support@humspizza.com<br />
              <strong>{t('accessibility.contact.phone')}:</strong> 0934 699 798<br />
              <strong>{t('accessibility.contact.address')}:</strong> {t('footer.addressLine1')}, {t('footer.addressLine2')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}