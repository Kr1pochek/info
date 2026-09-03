import { Building2, ExternalLink, MapPin, QrCode } from 'lucide-react';
import { assetUrl } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { customsPostQrCodes } from '../../data/customsQrCodes.js';

export default function CustomsQrPage() {
  const { language } = useLanguage();
  const kazakh = language === 'kz';

  return <article className="customs-qr-page">
    <header className="customs-qr-hero">
      <span><QrCode size={46} /></span>
      <div>
        <small>{kazakh ? 'Алматы қаласы' : 'Город Алматы'}</small>
        <h1>{kazakh ? 'Кеден бекеттерінің QR-кодтары' : 'QR-коды таможенных постов'}</h1>
        <p>{kazakh ? 'Әлеуметтік желілер табылмаған бекеттер үшін QR-код 2GIS мекенжайына апарады.' : 'Для постов без отдельных социальных сетей QR-код ведёт на адрес в 2GIS.'}</p>
      </div>
    </header>

    <section className="customs-qr-grid" aria-label={kazakh ? 'Кеден бекеттері' : 'Таможенные посты'}>
      {customsPostQrCodes.map((item) => {
        const title = item[kazakh ? 'titleKz' : 'titleRu'];
        return <article className="customs-qr-card" key={item.id}>
          <div className="customs-qr-card__image">
            <img src={assetUrl(item.qrImage)} alt={`${title} QR`} />
          </div>
          <div className="customs-qr-card__body">
            <div className="customs-qr-card__meta">
              <span><Building2 size={18} />{item.code}</span>
              <strong>{item[kazakh ? 'targetTypeKz' : 'targetTypeRu']}</strong>
            </div>
            <h2>{title}</h2>
            <p>{item[kazakh ? 'descriptionKz' : 'descriptionRu']}</p>
            <address><MapPin size={20} />{item[kazakh ? 'addressKz' : 'addressRu']}</address>
            <a href={item.targetUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={19} />
              {kazakh ? '2GIS ашу' : 'Открыть 2GIS'}
            </a>
          </div>
        </article>;
      })}
    </section>
  </article>;
}
