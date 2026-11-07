export const cleanAvatarUrl = (
  url?: string | null,
  fallback = ''
): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  let s = url.trim();
  if (s.includes('unsplash.com')) return fallback;
  const mdMatch = s.match(/\((https?:\/\/[^\s)]+)\)/) || s.match(/(https?:\/\/[^\s\])]+)/);
  if (mdMatch) s = mdMatch[1];
  if (s.includes('unsplash.com')) return fallback;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/')) {
    return s;
  }
  return fallback;
};
