import { createElement } from 'react'

interface IconifyIconProps {
  icon: string
  size?: number
  className?: string
  title?: string
}

/**
 * Small typed wrapper around the official Iconify web component.
 * The component script is loaded from Iconify in index.html; icons are fetched
 * on demand from the Iconify API. Text labels remain available if offline.
 */
export function IconifyIcon({ icon, size = 18, className = '', title }: IconifyIconProps) {
  return createElement(
    'iconify-icon',
    {
      icon,
      width: String(size),
      height: String(size),
      class: className,
      title,
      'aria-hidden': title ? undefined : 'true',
    } as never,
  )
}
