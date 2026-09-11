import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CmsPageItem {
  id: string;
  page_key: string;
  item_type: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url: string;
  extra: Record<string, string>;
  sort_order: number;
  is_visible: boolean;
}

export function usePageItems(pageKey: string) {
  const [items, setItems] = useState<CmsPageItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      const { data } = await supabase
        .from('site_page_items')
        .select('*')
        .eq('page_key', pageKey)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (mounted && data) {
        setItems(data as CmsPageItem[]);
      }
    };

    loadItems();
    return () => {
      mounted = false;
    };
  }, [pageKey]);

  return items;
}
