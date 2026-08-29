const transliteration = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h', һ: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sch', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(value, maxLength = 140) {
  const normalized = String(value || '').trim().toLowerCase().split('')
    .map((character) => transliteration[character] ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (normalized || 'item').slice(0, maxLength).replace(/-+$/g, '') || 'item';
}

export async function createUniqueSlug(delegate, value, maxLength = 140) {
  const base = slugify(value, maxLength);
  let candidate = base;
  let suffix = 2;
  while (await delegate.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    const ending = `-${suffix}`;
    candidate = `${base.slice(0, maxLength - ending.length).replace(/-+$/g, '')}${ending}`;
    suffix += 1;
  }
  return candidate;
}
