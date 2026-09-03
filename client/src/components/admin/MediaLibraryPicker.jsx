import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { broadcastMediaGroups, broadcastMediaLibrary } from '../../data/broadcastMediaLibrary.js';

export default function MediaLibraryPicker({ value, onChange, language, onlyGroup = '', defaultGroup = 'ANNOUNCEMENT' }) {
  const selectedGroup = broadcastMediaLibrary.find((media) => media.src === value)?.group;
  const [group, setGroup] = useState(onlyGroup || selectedGroup || defaultGroup);
  const groups = onlyGroup ? broadcastMediaGroups.filter((item) => item.value === onlyGroup) : broadcastMediaGroups;
  const visibleMedia = useMemo(() => broadcastMediaLibrary.filter((media) => group === 'ALL' || media.group === group), [group]);
  const titleKey = language === 'kz' ? 'titleKz' : 'titleRu';
  const labelKey = language === 'kz' ? 'labelKz' : 'labelRu';

  return <div className="media-library-picker">
    {!onlyGroup && <div className="media-library-filters" role="tablist" aria-label={language === 'kz' ? 'Сурет тақырыбы' : 'Тема изображения'}>
      {groups.map((item) => {
        const count = item.value === 'ALL' ? broadcastMediaLibrary.length : broadcastMediaLibrary.filter((media) => media.group === item.value).length;
        return <button type="button" className={group === item.value ? 'is-active' : ''} onClick={() => setGroup(item.value)} role="tab" aria-selected={group === item.value} key={item.value}>{item[labelKey]} <small>{count}</small></button>;
      })}
    </div>}
    <div className="media-library-summary"><span>{groups.find((item) => item.value === group)?.[labelKey]}</span><strong>{visibleMedia.length}</strong></div>
    <div className="broadcast-media-library">
      {visibleMedia.map((media) => {
        const active = value === media.src;
        return <button type="button" className={active ? 'is-selected' : ''} onClick={() => onChange(media.src)} aria-pressed={active} key={media.id}><img src={media.src} alt="" loading="lazy" /><span>{media[titleKey]}</span>{active && <CheckCircle2 size={20} />}</button>;
      })}
    </div>
  </div>;
}
