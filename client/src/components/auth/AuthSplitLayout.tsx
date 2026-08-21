import type { ReactNode } from 'react';

type AuthSplitLayoutProps = {
  children: ReactNode;
  /** Short line under brand on the form panel */
  panelEyebrow?: string;
};

/**
 * Two-pane auth shell:
 * - Left: Quran photo + overlay copy
 * - Right: cream workspace (matches logged-in app)
 * Mobile: form only. Tablet/desktop: two-column photo + form.
 */
export function AuthSplitLayout({
  children,
  panelEyebrow = 'Welcome',
}: AuthSplitLayoutProps) {
  return (
    <div className="auth-split relative grid min-h-[100vh] w-full grid-cols-1 overflow-x-hidden bg-[#F8FAFC] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:grid-cols-2">
      <aside className="relative hidden min-h-[100vh] w-full overflow-hidden md:block">
        <img
          src="/login-hero-bg.jpg?v=6"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          decoding="async"
          fetchPriority="high"
          aria-hidden
        />
        <div className="auth-hero-overlay pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 pt-10 sm:px-8 sm:pb-10 lg:px-12 lg:pb-14 xl:px-16">
          <div className="mb-4 h-0.5 w-11 rounded-full bg-[#D4AF37]" aria-hidden />
          <p className="auth-hero-kicker">Quran & Islamic Academy</p>
          <h2 className="auth-hero-title mt-3 max-w-lg">
            Learn with experienced Ustads in one-to-one and small group sessions.
          </h2>
        </div>
      </aside>

      <section className="auth-form-panel relative flex min-h-[100vh] flex-1 items-center justify-center px-5 py-8 sm:px-6 md:px-6 lg:px-10 lg:py-12">
        <div className="relative w-full max-w-[440px]">
          <div className="auth-brand mb-6 flex flex-col items-center text-center sm:mb-7">
            <div className="auth-logo-frame">
              <img
                src="/logo-shine-al-furqan.png"
                alt="Shine Al Furqan"
                className="mx-auto h-[4.25rem] w-auto object-contain sm:h-[4.75rem] lg:h-20"
              />
            </div>
            <h1
              className="mt-4 font-arabic text-[1.65rem] font-bold leading-snug text-[#B91C1C] sm:text-3xl"
              dir="rtl"
              lang="ur"
            >
              شاین الفرقان
            </h1>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37] sm:text-xs">
              Shine Al Furqan
            </p>
            <p className="mt-2.5 text-[14px] font-normal leading-relaxed text-[#64748B] sm:text-[15px]">
              {panelEyebrow}
            </p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
