import { BookOpenCheck, Scale, UserRoundCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { assetUrl } from '../../api/client.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function InformationPage() {
  const { informationSlug } = useParams();
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const kazakh = language === 'kz';

  if (informationSlug === 'taxpayer-rights') {
    const content = settings[kazakh ? 'taxpayerRightsKz' : 'taxpayerRightsRu'];
    return <article className="information-page"><header><div><Scale size={54} /></div><span>{t.usefulInformation}</span><h1>{t.taxpayerRights}</h1></header><section className="information-page__content">{content ? content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{kazakh ? 'Мазмұнды Тапсырыс беруші бекіткеннен кейін әкімші жариялайды.' : 'Содержание будет опубликовано администратором после утверждения Заказчиком.'}</p>}</section><footer><BookOpenCheck />{kazakh ? 'Дереккөз: Қазақстан Республикасының Салық кодексі және kgd.gov.kz материалдары' : 'Источник: Налоговый кодекс Республики Казахстан и материалы kgd.gov.kz'}</footer></article>;
  }

  if (informationSlug === 'ethics-officer') {
    const name = settings[kazakh ? 'ethicsOfficerNameKz' : 'ethicsOfficerNameRu'];
    const contacts = settings[kazakh ? 'ethicsOfficerContactsKz' : 'ethicsOfficerContactsRu'];
    return <article className="information-page ethics-page"><header><div><UserRoundCheck size={54} /></div><span>{t.usefulInformation}</span><h1>{t.ethicsOfficer}</h1></header><section className="ethics-card">{settings.ethicsOfficerPhoto ? <img src={assetUrl(settings.ethicsOfficerPhoto)} alt={name} /> : <div className="ethics-card__placeholder"><UserRoundCheck size={72} /></div>}<div><h2>{name || (kazakh ? 'Ақпарат нақтылануда' : 'Информация уточняется')}</h2><p>{contacts || (kazakh ? 'Байланыс деректерін әкімші Тапсырыс беруші ұсынғаннан кейін жариялайды.' : 'Контактные данные будут опубликованы администратором после предоставления Заказчиком.')}</p></div></section></article>;
  }

  return <NotFoundPage />;
}
