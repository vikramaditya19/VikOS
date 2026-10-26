import { CLOUD_PATHS, CLOUD_VIEWBOX } from './cloudPaths'

export default function AkatsukiCloud({ className = '', filled = false }) {
  return (
    <svg
      viewBox={CLOUD_VIEWBOX}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path
        vectorEffect="non-scaling-stroke"
        d={CLOUD_PATHS[0]}
        fill={filled ? 'rgba(196,18,47,0.55)' : 'none'}
      />
      <path vectorEffect="non-scaling-stroke" d={CLOUD_PATHS[1]} />
      <path vectorEffect="non-scaling-stroke" d={CLOUD_PATHS[2]} />
    </svg>
  )
}