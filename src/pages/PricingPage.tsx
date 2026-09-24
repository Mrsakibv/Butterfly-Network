import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Crown,
  KeyRound,
  Package,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';

interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
}

interface PricingPageProps {
  onOpenPlayModal: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'ranks':
    case 'rank':
      return Crown;

    case 'keys':
    case 'key':
      return KeyRound;

    case 'coins':
    case 'coin':
      return Coins;

    case 'wings':
    case 'wing':
      return Sparkles;

    default:
      return Package;
  }
};

const formatCategoryName = (category: string) => {
  return category
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPrice = (price: number, currency: string) => {
  const symbol =
    currency === 'BDT' || currency === '৳'
      ? '৳'
      : currency;

  return `${symbol} ${Number(price).toLocaleString()}`;
};

export const PricingPage: React.FC<PricingPageProps> = () => {
  const { navigate } = useRouter();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Minecraft Store | Butterfly network';
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('store_products')
        .select(
          `
            id,
            name,
            slug,
            description,
            image_url,
            category,
            price,
            currency,
            features,
            is_active,
            sort_order,
            created_at
          `
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Store products error:', error);
        setError(error.message);
        setProducts([]);
      } else {
        setProducts((data || []) as StoreProduct[]);
      }

      setLoading(false);
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category?.trim())
          .filter(Boolean) as string[]
      )
    );
  }, [products]);

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.includes(activeCategory)
    ) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const visibleProducts = useMemo(() => {
    return products.filter(
      (product) =>
        (product.category || 'other') === activeCategory
    );
  }, [products, activeCategory]);

  const openProduct = (product: StoreProduct) => {
    navigate(
      `/store/product/${encodeURIComponent(product.slug)}`
    );
  };

  return (
    <div className="pt-24 pb-20">
      <section className="relative py-12">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
              <Package className="h-3.5 w-3.5 text-purple-400" />
              Minecraft Store
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Power up your adventure
            </h1>

            <p className="text-base text-slate-400 sm:text-lg">
              Choose your favorite products for your
              Butterfly network experience.
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
              Loading store products...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
              <p className="text-sm font-semibold text-red-300">
                Failed to load store products.
              </p>

              <p className="mt-2 text-xs text-red-300/70">
                {error}
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
              No products are available yet.
            </div>
          ) : (
            <>
              {/* Categories */}
              <div className="mb-10 flex flex-wrap justify-center gap-3">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category);

                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                        activeCategory === category
                          ? 'border-purple-400/50 bg-purple-500/20 text-white shadow-[0_8px_30px_rgba(124,58,237,0.12)]'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {formatCategoryName(category)}
                    </button>
                  );
                })}
              </div>

              {/* Products */}
              {visibleProducts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
                  No products are available in this category yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product, index) => {
                    const ItemIcon = getCategoryIcon(
                      product.category || 'other'
                    );

                    const features = Array.isArray(
                      product.features
                    )
                      ? product.features
                      : [];

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.04,
                        }}
                        className="group relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:bg-white/[0.045]"
                      >
                        {/* Image */}
                        {product.image_url ? (
                          <button
                            onClick={() => openProduct(product)}
                            className="mb-4 h-40 overflow-hidden rounded-xl border border-white/10 bg-black/20 text-left"
                          >
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => openProduct(product)}
                            className="mb-4 flex h-40 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-purple-950/30 to-sky-950/20"
                          >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                              <ItemIcon className="h-8 w-8 text-purple-300" />
                            </div>
                          </button>
                        )}

                        {/* Category */}
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-400">
                          <ItemIcon className="h-3.5 w-3.5" />
                          {formatCategoryName(
                            product.category || 'Other'
                          )}
                        </div>

                        {/* Name */}
                        <button
                          onClick={() => openProduct(product)}
                          className="text-left"
                        >
                          <h2 className="text-lg font-bold text-white transition-colors group-hover:text-purple-200">
                            {product.name}
                          </h2>
                        </button>

                        {/* Description */}
                        <p className="mt-1 min-h-12 text-sm leading-relaxed text-slate-400">
                          {product.description ||
                            'Minecraft Store product'}
                        </p>

                        {/* Price */}
                        <div className="mt-4 text-2xl font-extrabold text-white">
                          {formatPrice(
                            product.price,
                            product.currency
                          )}
                        </div>

                        {/* Features */}
                        {features.length > 0 && (
                          <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
                            {features.slice(0, 4).map(
                              (feature, featureIndex) => (
                                <li
                                  key={`${product.id}-${featureIndex}`}
                                  className="flex items-start gap-2 text-xs text-slate-300"
                                >
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                                  {feature}
                                </li>
                              )
                            )}
                          </ul>
                        )}

                        {/* View details */}
                        <button
                          onClick={() => openProduct(product)}
                          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-bold text-white transition-all hover:border-purple-400/50 hover:bg-purple-500/20"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};