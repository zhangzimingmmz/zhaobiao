import { Image } from '@tarojs/components'

const ICONS = {
  home:
    '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  search:
    '<path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="6.5"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  mappin:
    '<path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  heart:
    '<path d="M12 20.5s-7-4.44-7-10.2C5 7.1 7.1 5 9.7 5c1.67 0 3.03.86 3.8 2.13C14.27 5.86 15.63 5 17.3 5 19.9 5 22 7.1 22 10.3c0 5.76-7 10.2-7 10.2H12Z"/>',
  user:
    '<circle cx="12" cy="8" r="3.5"/><path d="M5 19a7 7 0 0 1 14 0"/>',
  chevrondown:
    '<path d="M7 10l5 5 5-5"/>',
  banknote:
    '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9h.01M17 15h.01"/>',
  building:
    '<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-4h6v4"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01"/>',
  clock:
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
  filetext:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  x:
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
}

function toDataUri(markup, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      ${markup}
    </svg>
  `
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function AppIcon(props) {
  const {
    name,
    size = 32,
    color = '#86909C',
  } = props

  return (
    <Image
      src={toDataUri(ICONS[name] || ICONS.filetext, color)}
      style={{ width: `${size}rpx`, height: `${size}rpx` }}
    />
  )
}
