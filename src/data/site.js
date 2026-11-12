// Logos from Sysi-Travel-Brand-Kit (public/brand/, 1000×463 and 326×360, transparent).
// Kit rules: full logo at least 140 px wide, symbol at least 32 px; never stretched, recolored or given effects.
export const LOGO = "/brand/sysi-travel-logo.png"; // on ivory or white
export const LOGO_INVERSE = "/brand/sysi-travel-logo-inverse.png"; // on pétrole
export const SYMBOL = "/brand/sysi-travel-symbole.png"; // favicon, avatar

export const CONTACT = {
  phone: "+33 6 41 96 01 01",
  phoneHref: "tel:+33641960101",
  whatsappNumber: "33641960101",
  whatsappHref: `https://wa.me/33641960101?text=${encodeURIComponent(
    "Bonjour SYSI TRAVEL, je souhaite organiser un séjour en Guinée.",
  )}`,
  email: "simone.kamano@yahoo.fr",
  address: "Kaloum — Conakry, Guinée",
  hours: "Lundi – samedi, 9h – 19h (GMT)",
};

// Illustrations generated on Base44, copied here (public/images/illustrations/) until the
// client's own photos replace them (ORDRE.md, n° 3).
export const IMAGES = {
  hero: "/images/illustrations/accueil.jpg",
  loos: "/images/illustrations/iles-de-loos.jpg",
  fouta: "/images/illustrations/fouta-djallon.jpg",
  nimba: "/images/illustrations/mont-nimba.jpg",
  kinkon: "/images/illustrations/chutes-de-kinkon.jpg",
  conakry: "/images/illustrations/conakry.jpg",
  belair: "/images/illustrations/plage-de-bel-air.jpg",
  textile: "/images/produits/pagnes-tisses.jpg",
  sunset: "/images/illustrations/coucher-de-soleil.jpg",
};

// Types of tour (column circuits.kind, supabase/migrations/0005_circuits.sql).
export const CIRCUIT_KINDS = {
  circuit: "Circuit",
  excursion: "Excursion",
  visite: "Visite guidée",
};

// Public address of the site, for links that must be absolute (og:image for social previews).
export const SITE_ORIGIN = "https://sysitravel.com";
export const absoluteUrl = (path) => (path?.startsWith("/") ? `${SITE_ORIGIN}${path}` : path);

// The shop's sections, under « Boutique » in the navbar (src/lib/boutique.js, SHOP_CATEGORIES).
export const SHOP_MENU = [
  { label: "Mode femme", href: "/boutique?categorie=femme" },
  { label: "Mode homme", href: "/boutique?categorie=homme" },
  { label: "Sacs", href: "/boutique?categorie=sacs" },
  { label: "Bijoux", href: "/boutique?categorie=bijoux" },
  { label: "Livres & guides", href: "/boutique?categorie=livres" },
  { label: "Produits du terroir", href: "/produits" },
];

// The navbar: the pages people come for. Questions and contact are on the home page and in the
// footer. `active`: the paths under which the link shows as current.
export const NAV_LINKS = [
  { label: "Destinations", to: "/destinations" },
  { label: "Circuits", to: "/circuits" },
  { label: "Explorer", to: "/explorer" },
  { label: "Boutique", to: "/boutique", active: ["/boutique", "/panier", "/produits"], children: SHOP_MENU },
];

export const HERO_BADGES = [
  { label: "Partenaires locaux vérifiés" },
  { label: "Itinéraire sous 72 h" },
  { label: "Devis détaillé avant réservation" },
  { label: "Assistance 7j/7 sur place" },
];

export const PAINS = [
  {
    n: "01",
    title: "Des informations éparpillées",
    text: "Groupes WhatsApp, blogs obsolètes, avis contradictoires : impossible de savoir à quelle source se fier avant de partir.",
  },
  {
    n: "02",
    title: "Des prix opaques",
    text: "Sans repères clairs, difficile de budgéter un séjour à distance et de comparer sereinement les propositions.",
  },
  {
    n: "03",
    title: "Une organisation à distance",
    text: "Transport, guides, hébergement, visites : tout réserver depuis Paris, Montréal ou Bruxelles devient un second métier.",
  },
  {
    n: "04",
    title: "La peur de se faire avoir",
    text: "Avancer de l'argent à un inconnu, sans contrat ni interlocuteur identifié, freine presque tous les projets de retour.",
  },
];

export const FEATURES = [
  {
    icon: "compass",
    title: "Des destinations choisies",
    text: "Îles, hauts plateaux, cascades et patrimoine : chaque site est documenté avec soin par notre équipe sur place.",
  },
  {
    icon: "badge",
    title: "Des partenaires vérifiés",
    text: "Guides, écolodges et transporteurs rencontrés sur le terrain, avec des tarifs affichés et sans mauvaise surprise.",
  },
  {
    icon: "clock",
    title: "Un itinéraire sous 72 h",
    text: "Vous décrivez votre projet, nous revenons avec un programme clair, un budget détaillé et un calendrier réaliste.",
  },
  {
    icon: "headset",
    title: "Un accompagnement sur place",
    text: "Un interlocuteur joignable pendant tout le séjour, en français et en langues locales, de Conakry au Fouta.",
  },
];

export const DESTINATIONS = [
  {
    name: "Îles de Loos",
    region: "Conakry",
    image: IMAGES.loos,
    text: "Sable blanc, eau turquoise et mangrove, à vingt minutes de bateau du port de Conakry.",
    tags: ["Plage", "Snorkeling"],
  },
  {
    name: "Fouta Djallon",
    region: "Moyenne Guinée",
    image: IMAGES.fouta,
    text: "Hauts plateaux, villages peuls et brume du matin : la Guinée des grands espaces.",
    tags: ["Randonnée", "Culture"],
  },
  {
    name: "Mont Nimba",
    region: "Guinée forestière",
    image: IMAGES.nimba,
    text: "Réserve naturelle classée au patrimoine mondial, forêts primaires et sommets vertigineux.",
    tags: ["UNESCO", "Nature"],
  },
  {
    name: "Chutes de Kinkon",
    region: "Pita",
    image: IMAGES.kinkon,
    text: "Une cascade spectaculaire au cœur d'un cirque de verdure, à quelques heures de Dalaba.",
    tags: ["Cascade", "Photo"],
  },
  {
    name: "Conakry",
    region: "Presqu'île de Kaloum",
    image: IMAGES.conakry,
    text: "Corniche, marchés colorés, musique et couchers de soleil sur l'Atlantique.",
    tags: ["Ville", "Musique"],
  },
  {
    name: "Plage de Bel-Air",
    region: "Kindia",
    image: IMAGES.belair,
    text: "Sable sombre, cocotiers et horizon ouvert, à deux heures de la capitale.",
    tags: ["Plage", "Farniente"],
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Racontez votre projet",
    text: "Dates, budget, envies, nombre de voyageurs. Trois minutes suffisent pour poser les bases.",
  },
  {
    n: "02",
    title: "Recevez votre itinéraire",
    text: "Un programme détaillé, jour par jour, avec un budget ferme et nos partenaires locaux.",
  },
  {
    n: "03",
    title: "Voyagez sereinement",
    text: "Accueil à l'arrivée et un interlocuteur joignable pendant tout le séjour, en français et en langues locales.",
  },
];

export const FORMULES = [
  {
    id: "escapade",
    name: "Escapade Loos",
    image: IMAGES.loos,
    price: "390",
    duration: "3 jours / 2 nuits",
    tagline: "La première bouffée d'air, juste à côté de Conakry.",
    features: [
      "Transfert port et bateau",
      "2 nuits en écolodge",
      "Guide local francophone",
      "Un dîner les pieds dans le sable",
    ],
  },
  {
    id: "signature",
    name: "Signature Fouta",
    image: IMAGES.fouta,
    price: "1 190",
    duration: "8 jours / 7 nuits",
    tagline: "Le voyage que l'on raconte pendant des années.",
    features: [
      "Conakry, Dalaba et le Fouta",
      "Hébergements sélectionnés",
      "Guide privé et chauffeur",
      "Chutes de Kinkon et villages peuls",
      "Assistance 7j/7 sur place",
    ],
    highlight: true,
  },
  {
    id: "traversee",
    name: "Grande Traversée",
    image: IMAGES.nimba,
    price: "2 490",
    duration: "14 jours / 13 nuits",
    tagline: "La Guinée dans toute sa diversité, d'ouest en est.",
    features: [
      "Conakry, Fouta, forêt et Nimba",
      "Vols intérieurs inclus",
      "Nuits chez l'habitant",
      "Photographe sur deux journées",
      "Itinéraire 100 % personnalisé",
    ],
  },
];

// Reviews from real travellers only, with their consent: a made-up review is a misleading
// commercial practice (French consumer code). The home page hides the section while it is empty.
export const TESTIMONIALS = [];

export const FAQ = [
  {
    q: "Faut-il un visa pour venir en Guinée ?",
    a: "Oui pour la plupart des passeports. Nous vous transmettons la procédure à jour, les justificatifs utiles et la liste des pièces à préparer avant votre départ.",
  },
  {
    q: "Les vols internationaux sont-ils inclus dans vos tarifs ?",
    a: "Nos formules couvrent le séjour sur place. Sur demande, nous réservons également vos vols internationaux et vos correspondances intérieures, au tarif réel du moment.",
  },
  {
    q: "Puis-je voyager avec des enfants ?",
    a: "Oui. Nous adaptons les étapes, le rythme et les hébergements à l'âge des enfants. Les formules en famille prévoient des journées plus courtes et des pauses régulières.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Après votre demande, nous vous envoyons un devis détaillé. Les modalités de paiement (acompte, solde et moyens acceptés) vous sont confirmées par écrit avant toute réservation.",
  },
  {
    q: "Je ne sais pas encore quelles dates choisir, puis-je vous écrire ?",
    a: "Bien sûr. Décrivez simplement la période envisagée : nous vous proposerons les meilleures fenêtres selon la saison, les fêtes locales et votre budget.",
  },
];
// Local crafts (section « Produits locaux »). Photos in public/images/produits/; products
// without a photo yet show their icon (see LocalProducts.jsx).
export const PRODUCT_PHOTOS = [
  { src: "/images/produits/pagnes-teints.jpg", alt: "Pagnes teints aux motifs orange et indigo" },
  { src: "/images/produits/pagnes-tisses.jpg", alt: "Pile de pagnes tissés à rayures" },
  { src: "/images/produits/sacs-pagne.jpg", alt: "Sacs en pagne aux finitions cousues main" },
  { src: "/images/produits/pagnes-pochettes.jpg", alt: "Étal de pagnes et de pochettes colorées" },
];

export const LOCAL_PRODUCTS = [
  {
    icon: "shirt",
    name: "Pagnes",
    text: "Tissés à la main ou teints, aux motifs et aux couleurs de chaque région.",
  },
  {
    icon: "bag",
    name: "Sacs",
    text: "Sacs et pochettes en pagne, cousus et finis à la main.",
  },
  {
    icon: "leaf",
    name: "Beurre de karité",
    text: "Beurre de karité artisanal, pour la peau et les cheveux.",
  },
  {
    icon: "amphora",
    name: "Jarres",
    text: "Jarres en terre cuite façonnées par des potières locales.",
  },
  {
    icon: "bowl",
    name: "Calebasses",
    text: "Calebasses travaillées pour la cuisine, le service ou la décoration.",
  },
  {
    icon: "footprints",
    name: "Chaussures traditionnelles",
    text: "Confectionnées à la main par des artisans guinéens.",
  },
];
