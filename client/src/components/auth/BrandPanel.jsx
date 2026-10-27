import { LogoMark, Shield, Sparkles, Zap } from '../Icons.jsx';
import ProductPreview from './ProductPreview.jsx';
import { RotatingWords } from '../fx/Motion.jsx';

const FEATURES = [
  { icon: Sparkles, title: 'Duplicate detection', text: 'Similar doubts surface while you type.' },
  { icon: Shield, title: 'Race-safe claims', text: 'Only one TA can hold a doubt at a time.' },
  { icon: Zap, title: 'Live queue', text: 'Upvotes push the most common problems to the top.' },
];

// Left side of the auth screens: brand story + product preview. Large screens only.
export default function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-line bg-[#080a10]/55 backdrop-blur-[1px] lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-10 xl:p-12">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_28rem_at_20%_0%,rgb(79_70_229/0.35),transparent_70%),radial-gradient(30rem_22rem_at_90%_100%,rgb(52_211_153/0.14),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <LogoMark className="h-8 w-8" />
        Doubt Queue
      </div>

      <div className="relative space-y-10">
        <div className="max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-resolved" />
            Built for course TAs and students
          </p>
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight xl:text-[2.75rem]">
            Every <RotatingWords words={['doubt', 'question', 'bug', 'concept']} className="text-gradient" />,
            <br />
            answered once.
          </h2>
          <p className="mt-4 text-base text-muted">
            One shared queue per course. Ask, upvote what matters, and let TAs claim and resolve without
            stepping on each other.
          </p>
        </div>

        <ProductPreview />
      </div>

      {/* Dropped on short screens so the panel never scrolls. */}
      <ul className="stagger relative grid grid-cols-3 gap-5 [@media(max-height:900px)]:hidden">
        {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
          <li key={title} className="group">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 ring-1 ring-accent/30 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6">
              <FeatureIcon className="h-5 w-5 text-accent-fg" />
            </span>
            <p className="mt-2 text-sm font-medium text-fg">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-subtle">{text}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
