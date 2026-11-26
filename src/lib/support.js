// Where students go when they need help (for example a forgotten password).
export const SUPPORT_PHONE_DISPLAY = '0912 119 2596'
export const SUPPORT_PHONE_INTL = '2349121192596' // 09121192596 in international format, for WhatsApp links
export const SUPPORT_EMAIL = 'jce680@gmail.com'

export function whatsappLink(message) {
  return `https://wa.me/${SUPPORT_PHONE_INTL}?text=${encodeURIComponent(message)}`
}
export function emailLink(subject, body) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
