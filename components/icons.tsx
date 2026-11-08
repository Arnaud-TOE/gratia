import type { SVGProps } from 'react';

// A few line icons for the public pages, drawn on a 24px grid in the current colour.
type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const PlugIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7ZM12 17v5" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
  </svg>
);

export const SendIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);

export const HandIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-.6a7 7 0 0 1-5.5-2.7L3.3 16a1.6 1.6 0 0 1 2.4-2L7 15.3V11" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const FlameIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2 2-2.5 4-2.5 5.5C11 9 10 8 9.5 6.5 7 9 5 11.5 5 15a7 7 0 0 0 7 7Z" />
  </svg>
);

export const SyringeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m18 2 4 4M17 7l3-3M19 9 8.5 19.5a2.1 2.1 0 0 1-3 0l-1-1a2.1 2.1 0 0 1 0-3L15 5M9 11l4 4M5 19l-3 3M14 4l6 6" />
  </svg>
);

export const HeartPulseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6a5 5 0 1 1 7.5 6.6Z" />
    <path d="M3.5 12h4l1.5-3 3 6 1.5-3h7" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
