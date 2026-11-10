// « Explorer la Guinée » (/explorer): the 4 natural regions and the types of site.
// Region shapes: src/data/geo/ (geoBoundaries GIN ADM2, CC BY 3.0 IGO, WFP / OCHA ROWCA).

export const EXPLORER_REGIONS = [
  {
    key: "basse",
    label: "Basse Guinée",
    color: "#2F8F9D",
    image: "/images/sites/les-iles-de-loos.jpg",
    text: "La côte atlantique : Conakry, les îles de Loos, les plages de Boffa et les cascades de Kindia.",
  },
  {
    key: "moyenne",
    label: "Moyenne Guinée",
    color: "#D98A3A",
    image: "/images/sites/fouta-djalon.jpg",
    text: "Les plateaux du Fouta-Djalon : falaises, chutes d'eau, fraîcheur des hauteurs et villages peuls.",
  },
  {
    key: "haute",
    label: "Haute Guinée",
    color: "#C2553A",
    image: "/images/sites/parc-national-du-haut-niger.jpg",
    text: "Les savanes du Niger et du Milo, Kankan et Siguiri, au cœur de l'histoire mandingue.",
  },
  {
    key: "forestiere",
    label: "Guinée forestière",
    color: "#2E7D4F",
    image: "/images/sites/mont-nimba.jpg",
    text: "Forêts denses, monts Nimba et Ziama, chimpanzés de Bossou et traditions vivantes.",
  },
];

export const REGION_BY_KEY = Object.fromEntries(EXPLORER_REGIONS.map((region) => [region.key, region]));

export const SITE_CATEGORIES = [
  { key: "nature", label: "Nature", color: "#2E7D4F" },
  { key: "plage", label: "Plages & îles", color: "#2F8F9D" },
  { key: "culture", label: "Culture & histoire", color: "#B8862F" },
];

export const CATEGORY_BY_KEY = Object.fromEntries(SITE_CATEGORIES.map((category) => [category.key, category]));

export const GEO_ATTRIBUTION = "Régions : geoBoundaries (CC BY 3.0 IGO, PAM / OCHA)";
