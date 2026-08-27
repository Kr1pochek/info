export default function DgdLogo({ className = '', decorative = false }) {
  return <img
    className={`dgd-logo ${className}`.trim()}
    src="/branding/dgd-logo.png"
    alt={decorative ? '' : 'Логотип Комитета государственных доходов'}
    aria-hidden={decorative || undefined}
  />;
}
