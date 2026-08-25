import { useState } from 'react';
import { tintFor } from '../format.js';

// Las fotos son de picsum, asi que si no hay red mostramos un placeholder
// con el sku. Paso en la demo de octubre y quedo feisimo.
export default function Thumb({ src, seed, alt, className }) {
  const [broken, setBroken] = useState(false);

  if (broken || !src) {
    return (
      <div className={'thumb thumb--fallback ' + (className || '')} style={{ backgroundImage: tintFor(seed) }}>
        <span>{String(seed).slice(0, 3)}</span>
      </div>
    );
  }

  return (
    <img
      className={'thumb ' + (className || '')}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
