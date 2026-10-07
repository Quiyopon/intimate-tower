export const TowerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className}>
    <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      {/* Top face */}
      <path d="M50 5 L85 20 L50 35 L15 20 Z" />
      
      {/* Left and Right faces of layers */}
      {/* Layer 1 */}
      <path d="M15 20 V 35 L50 50 V 35" />
      <path d="M85 20 V 35 L50 50" />
      {/* Layer 2 */}
      <path d="M15 35 V 50 L50 65 V 50" />
      <path d="M85 35 V 50 L50 65" />
      {/* Layer 3 */}
      <path d="M15 50 V 65 L50 80 V 65" />
      <path d="M85 50 V 65 L50 80" />
      {/* Layer 4 */}
      <path d="M15 65 V 80 L50 95 V 80" />
      <path d="M85 65 V 80 L50 95" />

      {/* Cross lines to simulate pieces */}
      <path d="M38 10 L73 25" />
      <path d="M27 15 L62 30" />
      {/* Vertical splits for alternating layers */}
      {/* Layer 1 (front face split) */}
      <path d="M32 28 V 43" />
      <path d="M68 28 V 43" />
      {/* Layer 2 (side splits) */}
      <path d="M50 50 V 65" />
      {/* Layer 3 */}
      <path d="M32 58 V 73" />
      <path d="M68 58 V 73" />
      {/* Layer 4 */}
      <path d="M50 80 V 95" />
    </g>
  </svg>
);
