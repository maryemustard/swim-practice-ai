export function Wave({ className = "", fill = "#f0fdfa" }: { className?: string; fill?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill={fill}
        d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,80 L0,80 Z"
      />
    </svg>
  );
}
