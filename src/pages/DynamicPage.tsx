import React, { useEffect } from 'react';

interface DynamicPageData {
  id?: string;
  title: string;
  menu_label?: string;
  route: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
}

interface DynamicPageProps {
  page: DynamicPageData;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ page }) => {
  useEffect(() => {
    document.title = page.meta_title || page.title || 'Butterfly Network';
  }, [page]);

  const htmlContent = page.content || '<p>Page content coming soon.</p>';

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <span>{page.menu_label || page.title}</span>
          </div>

          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {page.title}
          </h1>

          {page.meta_description && (
            <p className="mt-4 text-base text-slate-300">{page.meta_description}</p>
          )}

          <div
            className="prose prose-invert mt-8 max-w-none text-slate-300"
            dangerouslySetInnerHTML={{
              __html: htmlContent
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br />')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>'),
            }}
          />
        </div>
      </div>
    </div>
  );
};
