import { Amphora, ArrowUpRight, Footprints, Leaf, MessageCircle, Shirt, ShoppingBag, Soup } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { CONTACT, LOCAL_PRODUCTS, PRODUCT_PHOTOS } from "@/data/site";

const ICONS = { shirt: Shirt, bag: ShoppingBag, leaf: Leaf, amphora: Amphora, bowl: Soup, footprints: Footprints };

function whatsappFor(product) {
  const text = product
    ? `Bonjour SYSI TRAVEL, je suis intéressé(e) par : ${product}. Quels sont les modèles et les prix ?`
    : "Bonjour SYSI TRAVEL, je suis intéressé(e) par vos produits locaux.";
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export default function LocalProducts() {
  return (
    <section id="produits" className="bg-ivory-soft py-14 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Artisanat de Guinée"
            title="Produits locaux"
            text="Pagnes, beurre de karité, jarres, calebasses, chaussures et sacs : ramenez un morceau de Guinée chez vous. Écrivez-nous sur WhatsApp pour connaître les modèles disponibles et les prix."
          />
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
          <Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[0, 1].map((column) => (
                <div key={column} className={column === 1 ? "mt-8 space-y-3 sm:mt-10 sm:space-y-4" : "space-y-3 sm:space-y-4"}>
                  {PRODUCT_PHOTOS.filter((_, index) => index % 2 === column).map((photo) => (
                    <div key={photo.src} className="aspect-square overflow-hidden rounded-2xl bg-petrol/10 sm:aspect-[4/5]">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>

          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {LOCAL_PRODUCTS.map((product, index) => {
                const Icon = ICONS[product.icon];
                return (
                  <li key={product.name}>
                    <Reveal delay={(index % 2) * 80} className="h-full">
                      <a
                        href={whatsappFor(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full gap-4 rounded-2xl border border-petrol/10 bg-white p-5 transition-colors duration-300 hover:border-gold"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-petrol text-gold">
                          <Icon className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        <span>
                          <span className="flex items-center gap-1.5 text-[1.02rem] font-semibold text-petrol">
                            {product.name}
                            <ArrowUpRight className="h-4 w-4 text-gold-deep opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </span>
                          <span className="mt-1 block text-[0.9rem] leading-relaxed text-petrol/65">{product.text}</span>
                        </span>
                      </a>
                    </Reveal>
                  </li>
                );
              })}
            </ul>

            <Reveal>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
                <a
                  href={whatsappFor()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-caps inline-flex w-full items-center justify-center gap-2 rounded-full bg-petrol px-7 py-4 text-ivory transition-colors duration-300 hover:bg-petrol-deep sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4 text-gold" />
                  Commander sur WhatsApp
                </a>
                <p className="text-[0.88rem] text-petrol/60">Modèles, disponibilités et prix sur demande.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
