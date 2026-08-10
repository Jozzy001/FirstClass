import React from 'react'

// The app's signature progress device — segmented blocks instead of a
// smooth bar, echoing the "training/scoreboard" visual direction.
export default function SegMeter({ completed, total }) {
  const segments = Array.from({ length: total }, (_, i) => i < completed)
  return (
    <div className="seg-meter">
      {segments.map((isOn, i) => (
        <i key={i} className={isOn ? 'on' : ''} />
      ))}
    </div>
  )
}
