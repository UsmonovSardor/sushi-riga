// Cloudinary on-the-fly transforms: auto format + quality at a target width.
// Non-Cloudinary URLs are returned untouched.
export function clImg(url, w = 600) {
  if (!url || typeof url !== 'string') return url || '/placeholder-sushi.png';
  return url.includes('cloudinary.com')
    ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`)
    : url;
}

// Builds a responsive srcset so small viewports download small images.
export function clSrcSet(url, widths) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return undefined;
  return widths.map(w => `${clImg(url, w)} ${w}w`).join(', ');
}
