import BrandPanel from './auth/BrandPanel.jsx';
import { LogoMark } from './Icons.jsx';

// Split-screen shell for Login/Register: brand panel on large screens, form on the right.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <BrandPanel />

      <main className="relative flex flex-col justify-center px-5 py-10 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_20rem_at_50%_0%,rgb(79_70_229/0.18),transparent_70%)] lg:hidden"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-sm animate-fade-up">
          {/* Compact brand header when the panel is hidden */}
          <div className="mb-8 flex items-center gap-2.5 text-lg font-semibold tracking-tight lg:hidden">
            <LogoMark className="h-8 w-8" />
            Doubt Queue
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <p className="mt-8 text-center text-sm text-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
