import { Link } from "@tanstack/react-router";
import { IMAGES, LOGO, LOGO_INVERSE } from "@/data/site";

// Full-screen layout shared by the auth pages, in the site's petrol / gold / ivory look:
// a photo panel on large screens, the form card beside it.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-screen bg-background text-petrol lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-petrol-deep lg:block">
        <img src={IMAGES.fouta} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full animate-kenburns object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-petrol-deep via-petrol-deep/55 to-petrol-deep/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" aria-label="SYSI TRAVEL Guinée — accueil" className="inline-flex w-fit items-center">
            <img src={LOGO_INVERSE} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[5.26rem] w-auto object-contain" />
          </Link>
          <div className="max-w-md animate-fade-up">
            <p className="eyebrow text-gold">Bienvenue chez vous.</p>
            <p className="mt-4 text-[clamp(1.6rem,2.4vw,2.2rem)] font-bold leading-[1.1] tracking-[-0.015em] text-ivory">
              La Guinée comme vous ne l'avez jamais vécue.
            </p>
            <div className="mt-8 h-px w-16 bg-gold/60" />
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" aria-label="SYSI TRAVEL Guinée — accueil" className="mb-8 inline-flex items-center lg:hidden">
            <img src={LOGO} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[4rem] w-auto object-contain" />
          </Link>
          <div className="mb-8">
            <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold-deep">
              <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold leading-tight tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="mt-2 text-[0.98rem] text-petrol/65">{subtitle}</p>}
          </div>
          <div className="border border-petrol/15 bg-white p-7 shadow-[0_30px_70px_-50px_rgba(18,61,67,0.7)] sm:p-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-petrol/65">{footer}</p>}
          <p className="mt-8 text-center">
            <Link to="/" className="label-caps text-petrol/50 transition-colors hover:text-petrol">
              ← Retour au site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
