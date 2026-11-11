import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Clock, Download, MessageCircle } from "lucide-react";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import BookCover from "@/components/boutique/BookCover";
import { CONTACT } from "@/data/site";
import { formatSize } from "@/lib/boutique";
import { getTelechargement } from "@/lib/server-fns";

// The buyer's personal page (link e-mailed once the payment is received): their books, each
// with its download button. Never indexed; the token is the only key.
export const Route = createFileRoute("/telechargement/$token")({
  validateSearch: (search) => ({ erreur: typeof search.erreur === "string" ? search.erreur.slice(0, 20) : undefined }),
  loader: ({ params }) => getTelechargement({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { title: "Mes livres à télécharger — SYSI TRAVEL" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TelechargementPage,
});

const dayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Conakry" });

const ERRORS = {
  refuse: "Ce téléchargement n'est plus possible avec ce lien (lien expiré ou nombre de téléchargements atteint).",
  indisponible: "Le fichier n'a pas pu être préparé. Réessayez dans un instant ; si le problème continue, écrivez-nous.",
};

function Message({ icon: Icon = AlertCircle, title, children }) {
  return (
    <div className="max-w-2xl border border-petrol/15 bg-white p-8">
      <Icon className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
      <h1 className="mt-4 font-display text-[1.6rem] font-bold leading-snug text-petrol">{title}</h1>
      <div className="mt-3 text-[1rem] leading-relaxed text-petrol/75">{children}</div>
      <a
        href={CONTACT.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
      >
        <MessageCircle className="h-4 w-4" /> Nous écrire sur WhatsApp
      </a>
    </div>
  );
}

function TelechargementPage() {
  const commande = Route.useLoaderData();
  const { token } = Route.useParams();
  const { erreur } = Route.useSearch();

  const usable =
    commande?.statut === "payee" && !commande.expire && commande.telechargements < commande.limite;
  const remaining = commande ? Math.max(0, commande.limite - commande.telechargements) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main className="bg-background pb-20 pt-36 lg:pt-40">
        <div className="mx-auto max-w-site px-6">
          {!commande ? (
            <Message title="Lien introuvable">
              Ce lien de téléchargement n'existe pas. Vérifiez qu'il est complet (copiez-le depuis
              l'e-mail reçu), ou écrivez-nous avec votre référence de commande.
            </Message>
          ) : commande.statut === "annulee" ? (
            <Message title={`Commande ${commande.reference} annulée`}>
              Cette commande a été annulée. Si c'est une erreur, écrivez-nous avec sa référence.
            </Message>
          ) : commande.statut === "en_attente" ? (
            <Message icon={Clock} title="Paiement en attente">
              Votre commande {commande.reference} est bien enregistrée. Vos livres seront téléchargeables
              ici dès que votre paiement sera reçu ; vous recevrez aussi un e-mail.
            </Message>
          ) : !usable ? (
            <Message title="Ce lien n'est plus actif">
              {commande.expire
                ? "La période de téléchargement de 30 jours est terminée."
                : "Le nombre de téléchargements permis est atteint."}{" "}
              Écrivez-nous avec votre référence ({commande.reference}) : nous vous renvoyons un lien.
            </Message>
          ) : (
            <>
              <p className="eyebrow text-gold-deep">Commande {commande.reference}</p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                Vos livres, {commande.nom}
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
                Téléchargez vos PDF, puis lisez-les sur téléphone, tablette ou ordinateur. Ce lien
                personnel reste valable jusqu'au {dayFormat.format(new Date(commande.lien_expire_le))}{" "}
                ({remaining} téléchargement{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""}).
              </p>

              {erreur && ERRORS[erreur] ? (
                <p className="mt-6 flex max-w-2xl items-start gap-2 border border-destructive/30 bg-destructive/5 p-4 text-[0.92rem] text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {ERRORS[erreur]}
                </p>
              ) : null}

              <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {commande.livres.map((livre, index) => (
                  <li key={livre.id ?? index} className="book-hover flex gap-5 border border-petrol/15 bg-white p-5">
                    <div className="w-20 shrink-0">
                      <BookCover book={livre} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h2 className="font-display text-[1.05rem] font-bold leading-snug text-petrol">{livre.title}</h2>
                      {livre.author ? <p className="mt-1 text-[0.85rem] text-petrol/55">{livre.author}</p> : null}
                      {livre.disponible && livre.id ? (
                        <a
                          href={`/api/telechargement/${token}/${livre.id}`}
                          className="label-caps mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full bg-gold px-5 py-3 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol hover:text-ivory"
                        >
                          <Download className="h-4 w-4" /> Télécharger
                          {livre.file_size ? <span className="normal-case tracking-normal opacity-70">({formatSize(livre.file_size)})</span> : null}
                        </a>
                      ) : (
                        <p className="mt-auto pt-3 text-[0.85rem] text-petrol/60">
                          Fichier indisponible pour l'instant : écrivez-nous, nous vous l'envoyons.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-12 text-[0.92rem] text-petrol/60">
                Un souci ? <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-gold-deep underline underline-offset-4">Écrivez-nous sur WhatsApp</a>{" "}
                ou continuez vers la <Link to="/boutique" className="text-gold-deep underline underline-offset-4">boutique</Link>.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
