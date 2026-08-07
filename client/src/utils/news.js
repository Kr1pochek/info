export const newsCategories = [
  { value: '', label: 'Все новости' },
  { value: 'IMPORTANT', label: 'Важное' },
  { value: 'ANNOUNCEMENT', label: 'Объявления' },
  { value: 'EVENT', label: 'События' },
  { value: 'GENERAL', label: 'Новости' },
];

export function newsCategoryLabel(value) {
  return newsCategories.find((item) => item.value === value)?.label || 'Новости';
}

export function newsCategoryClass(value) {
  return `news-category news-category--${String(value || 'GENERAL').toLowerCase()}`;
}
