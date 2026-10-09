"use client";

import { useState } from "react";
import { SmartImage } from "./SmartImage";

export type GalleryImage = { src: string; alt: string };

/** Large picture with thumbnails. Thumbnails are real buttons (keyboard and screen-reader friendly). */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-navy shadow-sm">
        <SmartImage src={current.src} alt={current.alt} priority className="aspect-[4/3] w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-3" aria-label="Product pictures">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show picture ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                className={`block overflow-hidden rounded-lg border-2 bg-navy transition ${i === active ? "border-blue-600" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <SmartImage src={img.src} alt="" width={160} height={120} className="h-16 w-20 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
