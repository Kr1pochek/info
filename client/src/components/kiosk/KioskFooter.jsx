import { QrCode } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

const qrCodes = [
  {
    id: 'kgd',
    image: '/qr/kgd-portal.png',
    url: 'kgd.gov.kz',
    labelRu: 'Портал государственных доходов',
    labelKz: 'Мемлекеттік кірістер порталы',
  },
  {
    id: 'egov',
    image: '/qr/egov-portal.png',
    url: 'egov.kz',
    labelRu: 'Электронное правительство',
    labelKz: 'Электрондық үкімет',
  },
];

export default function KioskFooter() {
  const { language, t } = useLanguage();
  const labelKey = language === 'kz' ? 'labelKz' : 'labelRu';

  return <footer className="kiosk-footer">
    <div className="kiosk-footer__content">
      <div className="kiosk-footer__intro">
        <span><QrCode size={28} /></span>
        <div><strong>{t.officialResources}</strong><small>{t.scanQrCode}</small></div>
      </div>
      <div className="kiosk-footer__qr-list">
        {qrCodes.map((code) => <article className="kiosk-footer__qr" key={code.id}>
          <img src={code.image} alt={`${code[labelKey]} — QR ${code.url}`} />
          <div><strong>{code[labelKey]}</strong><span>{code.url}</span></div>
        </article>)}
      </div>
    </div>
  </footer>;
}
