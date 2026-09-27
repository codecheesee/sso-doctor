import type { SVGProps } from 'react';

/**
 * Hand-drawn duotone icon set on a 24px grid. Strokes use currentColor;
 * the soft fill layer (<Fill>) is the same color at low opacity, so every
 * icon follows the text color it sits in.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

const Fill = ({ d }: { d: string }) => <path d={d} fill="currentColor" fillOpacity={0.16} stroke="none" />;
const FillCircle = ({ r = 9 }: { r?: number }) => <circle cx="12" cy="12" r={r} fill="currentColor" fillOpacity={0.16} stroke="none" />;

/* ---------- brand ---------- */

/** SSO Doctor mark: a shield with a heartbeat trace. Colors are fixed so it reads the same in both themes. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="sd-logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="sd-logo-shine" x1="16" y1="0" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sd-logo-bg)" />
      <rect width="32" height="32" rx="9" fill="url(#sd-logo-shine)" />
      <path d="M16 6.5 24 9.5v6.2c0 4.8-3.3 8.4-8 9.8-4.7-1.4-8-5-8-9.8V9.5l8-3Z" fill="#fff" fillOpacity=".18" stroke="#fff" strokeOpacity=".9" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10.5 16h2.6l1.5-3.2 2.6 6.4 1.6-3.2h2.7" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- status ---------- */

export const CheckCircleIcon = (p: IconProps) => (
  <Base {...p}>
    <FillCircle />
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </Base>
);
export const XCircleIcon = (p: IconProps) => (
  <Base {...p}>
    <FillCircle />
    <circle cx="12" cy="12" r="9" />
    <path d="m14.8 9.2-5.6 5.6m0-5.6 5.6 5.6" />
  </Base>
);
export const AlertTriangleIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 16.8h.01" />
  </Base>
);
export const InfoIcon = (p: IconProps) => (
  <Base {...p}>
    <FillCircle />
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16.5v-5M12 8h.01" />
  </Base>
);

/* ---------- actions ---------- */

export const CopyIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V9Z" />
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5" />
  </Base>
);
export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6.5 9.5 17 4 11.5" />
  </Base>
);
export const ClipboardIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V6A1.5 1.5 0 0 1 6 4.5Z" />
    <rect x="8.5" y="2.5" width="7" height="4" rx="1.2" />
    <path d="M15.5 4.5H18a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V6A1.5 1.5 0 0 1 6 4.5h2.5M9 12h6M9 16h4" />
  </Base>
);
export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M5.5 6.5h13l-.9 13a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9l-.9-13Z" />
    <path d="M3.5 6.5h17M9 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v2M5.5 6.5l.9 13a2 2 0 0 0 2 1.9h7.2a2 2 0 0 0 2-1.9l.9-13M10 11v6M14 11v6" />
  </Base>
);
export const UploadIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M3 15h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M16.5 7.5 12 3 7.5 7.5M12 3v12" />
  </Base>
);
export const WrenchIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.5 6.5a2.1 2.1 0 0 1-3-3l6.5-6.5a6 6 0 0 1 7.9-7.9l-3.4 3.4Z" />
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.5 6.5a2.1 2.1 0 0 1-3-3l6.5-6.5a6 6 0 0 1 7.9-7.9l-3.4 3.4Z" />
  </Base>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

/* ---------- theme ---------- */

export const SunIcon = (p: IconProps) => (
  <Base {...p}>
    <FillCircle r={4} />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Base>
);
export const MoonIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z" />
    <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z" />
  </Base>
);
export const MonitorIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M4 3.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
    <rect x="2" y="3.5" width="20" height="13" rx="2" />
    <path d="M8 20.5h8M12 16.5v4" />
  </Base>
);

/* ---------- domain ---------- */

export const PulseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12h3.5l2.5-6 4.5 12 2.5-6H21" />
  </Base>
);
export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M5 11h14a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 11Z" />
    <rect x="3.5" y="11" width="17" height="10" rx="1.5" />
    <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11M12 15v2" />
  </Base>
);
export const ShieldCheckIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M12 2.8 19.5 5.6v6c0 4.6-3.2 8.2-7.5 9.6-4.3-1.4-7.5-5-7.5-9.6v-6L12 2.8Z" />
    <path d="M12 2.8 19.5 5.6v6c0 4.6-3.2 8.2-7.5 9.6-4.3-1.4-7.5-5-7.5-9.6v-6L12 2.8Z" />
    <path d="m9 12 2.1 2.1L15.2 10" />
  </Base>
);
export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
    <circle cx="15" cy="6" r="2" fill="currentColor" fillOpacity={0.16} />
    <circle cx="9" cy="12" r="2" fill="currentColor" fillOpacity={0.16} />
    <circle cx="17" cy="18" r="2" fill="currentColor" fillOpacity={0.16} />
  </Base>
);
export const ScanIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M7 7h10v10H7z" />
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10" />
  </Base>
);
export const StethoscopeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 3H4v5.5a5 5 0 0 0 10 0V3h-1M9 13.5V16a5 5 0 0 0 10 0v-2" />
    <circle cx="19" cy="11.5" r="2.5" fill="currentColor" fillOpacity={0.16} />
  </Base>
);
export const LayersIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M12 3 21 8l-9 5-9-5 9-5Z" />
    <path d="M12 3 21 8l-9 5-9-5 9-5Z" />
    <path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" />
  </Base>
);
export const CodeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />
  </Base>
);
export const KeyIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4.5" fill="currentColor" fillOpacity={0.16} />
    <circle cx="8" cy="15" r="4.5" />
    <path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2" />
  </Base>
);
export const FingerprintIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.3 18.5A12 12 0 0 0 8 12a4 4 0 0 1 8 0c0 1.2 0 2.4-.2 3.5M12 12c0 3-.6 5.8-1.8 8.3M18.8 17.5c.4-1.8.7-3.6.7-5.5a7.5 7.5 0 0 0-12.8-5.3M4.5 15.2c.3-1 .5-2.1.5-3.2a7 7 0 0 1 .5-2.6M14.6 20.5c.3-.8.6-1.7.8-2.5" />
  </Base>
);
export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <FillCircle />
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);
export const SparkleIcon = (p: IconProps) => (
  <Base {...p}>
    <Fill d="M12 3c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6Z" />
    <path d="M12 3c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6ZM18.5 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />
  </Base>
);
export const GithubIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="1em" height="1em" fill="currentColor" {...p}>
    <path
      fillRule="evenodd"
      d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
    />
  </svg>
);
