// Logos from Sysi-Travel-Brand-Kit (public/brand/, 1000×463 and 326×360, transparent).
// Kit rules: full logo at least 140 px wide, symbol at least 32 px; never stretched, recolored or given effects.
export const LOGO = "/brand/sysi-travel-logo.png"; // on ivory or white
export const LOGO_INVERSE = "/brand/sysi-travel-logo-inverse.png"; // on pétrole
export const SYMBOL = "/brand/sysi-travel-symbole.png"; // favicon, avatar

export const CONTACT = {
  phone: "+33 6 41 96 01 01",
  phoneHref: "tel:+33641960101",
  whatsappHref: `https://wa.me/33641960101?text=${encodeURIComponent(
    "Bonjour SYSI TRAVEL, je souhaite organiser un séjour en Guinée.",
  )}`,
  email: "simone.kamano@yahoo.fr",
  address: "Kaloum — Conakry, Guinée",
  hours: "Lundi – samedi, 9h – 19h (GMT)",
};

export const IMAGES = {
  hero: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/8001a4000_generated_4eab33cf.png",
  loos: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/241672d56_generated_e5e835c9.png",
  fouta: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/a96a29944_generated_d3eea4ba.png",
  nimba: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3d58d3f65_generated_e938acc8.png",
  kinkon: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/86144e1f1_generated_df6aa439.png",
  conakry: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3dfcf3a27_generated_fb507fb0.png",
  belair: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/1a022afe2_generated_081a0a42.png",
  textile: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/189704885_generated_bfb5b1ac.png",
  sunset: "https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/6878ea223_generated_d5361e93.png",
};

export const NAV_LINKS = [
  { label: "Destinations", href: "#destinations" },
  { label: "La plateforme", href: "#solution" },
  { label: "Notre offre", href: "#offre" },
  { label: "Questions", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export const HERO_BADGES = [
  { label: "Partenaires locaux vérifiés" },
  { label: "Itinéraire sous 72 h" },
  { label: "Paiement sécurisé" },
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
    text: "Paiement sécurisé, accueil à l'arrivée et un interlocuteur joignable pendant tout le séjour.",
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

export const TESTIMONIALS = [
  {
    quote:
      "J'ai emmené mes deux filles découvrir les îles de Loos. Tout était pensé, du bateau au dîner sur la plage. Pour la première fois, je n'ai pas eu à tout organiser moi-même.",
    name: "Aïssatou D.",
    city: "Paris",
    detail: "Escapade Loos, en famille",
  },
  {
    quote:
      "Le Fouta Djallon m'a bouleversé. L'itinéraire était juste, sans course, avec des guides qui connaissaient chaque village et chaque sentier.",
    name: "Mamadou C.",
    city: "Montréal",
    detail: "Signature Fouta, 8 jours",
  },
  {
    quote:
      "Un devis clair en 48 heures, des paiements sécurisés et quelqu'un sur place pour répondre. C'est exactement ce qui manquait à mes retours au pays.",
    name: "Fatoumata B.",
    city: "Bruxelles",
    detail: "Grande Traversée, 14 jours",
  },
];

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
    a: "Un acompte de 30 % confirme votre réservation en ligne de façon sécurisée. Le solde est réglé quinze jours avant le départ. Chaque paiement est confirmé par écrit.",
  },
  {
    q: "Je ne sais pas encore quelles dates choisir, puis-je vous écrire ?",
    a: "Bien sûr. Décrivez simplement la période envisagée : nous vous proposerons les meilleures fenêtres selon la saison, les fêtes locales et votre budget.",
  },
];