import React, { useEffect } from 'react';
import { Image as ImageIcon, Camera } from 'lucide-react';
import { usePageItems } from '../hooks/usePageItems';

export const GalleryPage: React.FC = () => {
  const pageItems = usePageItems('gallery');

  useEffect(() => {
    document.title = 'Gallery | Butterfly Network';
  }, []);

  const defaultGalleryItems = [
    'Epic builds',
    'PvP action',
    'Network events',
    'Community moments',
    'City scenes',
    'Staff highlights',
  ];
  const galleryItems = pageItems.length > 0 ? pageItems : defaultGalleryItems.map((title, index) => ({
    id: String(index),
    title,
    image_url: '',
    description: '',
  }));

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            Gallery
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Moments from the Butterfly community
          </h1>
          <p className="mt-4 text-base text-slate-300">
            From stunning architecture to gameplay highlights, this is the visual side of our server culture.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, index) => (
            <div
              key={item.id || item.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-5"
            >
              <div
                className="mb-5 h-48 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.38),_rgba(15,23,42,0.95)_55%)]"
                  style={{
                    backgroundImage: item.image_url
                      ? `linear-gradient(135deg, rgba(15,23,42,0.1), rgba(15,23,42,0.45)), url(${item.image_url})`
                      : `linear-gradient(135deg, rgba(168,85,247,0.25), rgba(14,165,233,0.18)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 30%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Collection</div>
                  <h2 className="mt-2 text-lg font-bold text-white">{item.title}</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-sky-400"
                  style={{ width: `${55 + index * 8}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
