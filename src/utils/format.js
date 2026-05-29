export function formatDate(iso, opts = {}) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: opts.year === false ? undefined : 'numeric',
  })
}

export function relativeDays(iso) {
  if (!iso) return 'never'
  const today = new Date('2026-05-29T12:00:00')
  const d = new Date(iso)
  const diff = Math.round((today - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff > 0) return `${diff} days ago`
  if (diff === -1) return 'tomorrow'
  return `in ${Math.abs(diff)} days`
}

export function initialsColor(seed) {
  const colors = ['#2563eb', '#6366f1', '#0891b2', '#0d9488', '#7c3aed', '#db2777']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}
