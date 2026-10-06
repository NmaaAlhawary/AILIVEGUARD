// Freely-licensed portraits from Wikimedia Commons. Attribution for each file
// is in public/players/credits.json.
const defaultPhotoFiles: Record<string, string> = {
  'ter stegen': 'ter-stegen',
  araujo: 'araujo',
  christensen: 'christensen',
  kounde: 'kounde',
  balde: 'balde',
  'de jong': 'de-jong',
  gavi: 'gavi',
  pedri: 'pedri',
  raphinha: 'raphinha',
  lewandowski: 'lewandowski',
  'ferran torres': 'ferran-torres',
  'inaki pena': 'inaki-pena',
  'fermin lopez': 'fermin-lopez',
  'joao felix': 'joao-felix',
  yamal: 'yamal',
  'ansu fati': 'ansu-fati',
};

// Match on the name with accents and punctuation removed, so "Araújo" and
// "Araujo" both find the same portrait.
const normalise = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim();

export const getDefaultPhoto = (name: string): string | undefined => {
  const file = defaultPhotoFiles[normalise(name)];
  return file ? `${import.meta.env.BASE_URL}players/${file}.jpg` : undefined;
};
