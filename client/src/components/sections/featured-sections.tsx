import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturedSections() {
  const { t } = useLanguage();
  
  const sections = [
    {
      title: t('featured.signature.title'),
      description: t('featured.signature.description'),
      image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      href: "/menu",
    },
    {
      title: t('featured.atmosphere.title'),
      description: t('featured.atmosphere.description'),
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      href: "/about",
    },
    {
      title: t('featured.service.title'),
      description: t('featured.service.description'),
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      href: "/menu",
    },
    {
      title: t('menu.ourSignatureDishes'),
      description: t('menu.featuredDishes'),
      image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80",
      href: "/menu",
      className: "lg:col-span-2",
      titleClass: "text-3xl",
      descriptionClass: "text-lg",
    },
    {
      title: t('menu.beverages'),
      description: t('featured.signature.description'),
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      href: "/menu",
    },
  ];

  return (
    <section className="py-20 bg-noir-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <Link 
              key={index}
              href={section.href}
              className={`relative group card-hover cursor-pointer ${section.className || ""}`}
            >
              <div className="aspect-[4/3] lg:aspect-[4/3] bg-cover bg-center rounded-lg overflow-hidden"
                   style={{
                     backgroundImage: `url(${section.image})`,
                     aspectRatio: section.className?.includes("col-span-2") ? "8/3" : "4/3"
                   }}>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className={`font-bold text-shadow ${section.titleClass || "text-3xl"}`}>
                    {section.title}
                  </h3>
                  <p className={`text-gray-200 mt-3 ${section.descriptionClass || "text-lg"}`}>
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
