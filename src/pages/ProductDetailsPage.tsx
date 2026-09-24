import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Crown,
  KeyRound,
  Package,
  Sparkles,
  ShoppingCart,
  Loader2,
  AlertCircle,
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

export const ProductDetailsPage: React.FC = () => {
  const { navigate } = useRouter();

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const pathname = window.location.pathname;

        const slug = decodeURIComponent(
          pathname.replace('/store/product/', '').split('/')[0]
        );

        if (!slug) {
          setError('Product not found.');
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
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
              sort_order
            `
          )
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (queryError) {
          console.error('Product details error:', queryError);
          setError(queryError.message);
          setProduct(null);
          return;
        }

        if (!data) {
          setError('This product is not available.');
          setProduct(null);
          return;
        }

        setProduct(data as StoreProduct);

        document.title = `${data.name} | Minecraft Store`;
      } catch (err) {
        console.error('Product loading error:', err);
        setError('Unable to load this product.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, []);

  const handleBuyNow = () => {
    if (!product) return;

    navigate(
      `/store/checkout?product=${encodeURIComponent(product.id)}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            Loading product...
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <button
            onClick={() => navigate('/pricing')}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </button>

          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>

            <h1 className="text-xl font-bold text-white">
              Product Not Found
            </h1>

            <p className="mt-2 text-sm text-red-300/80">
              {error || 'This product is not available.'}
            </p>

            <button
              onClick={() => navigate('/pricing')}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
            >
              Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const category = product.category || 'Other';
  const ItemIcon = getCategoryIcon(category);

  const features = Array.isArray(product.features)
    ? product.features
    : [];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="relative py-8 sm:py-12">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[150px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <button
            onClick={() => navigate('/pricing')}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Minecraft Store
          </button>

          {/* Main product */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] lg:grid-cols-2"
          >
            {/* Product image */}
            <div className="relative min-h-[360px] overflow-hidden border-b border-white/10 bg-black/20 lg:min-h-[620px] lg:border-b-0 lg:border-r">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center bg-gradient-to-br from-purple-950/40 via-black/30 to-sky-950/30">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-purple-400/20 bg-purple-500/10 shadow-[0_0_80px_rgba(139,92,246,0.2)]">
                    <ItemIcon className="h-14 w-14 text-purple-300" />
                  </div>
                </div>
              )}

              {/* Image overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

              {/* Category badge */}
              <div className="absolute left-5 top-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md">
                  <ItemIcon className="h-3.5 w-3.5 text-purple-300" />
                  {formatCategoryName(category)}
                </div>
              </div>
            </div>

            {/* Product information */}
            <div className="flex flex-col p-6 sm:p-8 lg:p-12">
              <div className="mb-5">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                  Minecraft Store
                </span>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {product.name}
                </h1>
              </div>

              <div className="mb-7">
                <div className="text-3xl font-black text-white sm:text-4xl">
                  {formatPrice(product.price, product.currency)}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  One-time purchase
                </p>
              </div>

              <div className="mb-8 h-px bg-white/10" />

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Description
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {product.description ||
                    'Get this Minecraft Store product and enhance your Butterfly network experience.'}
                </p>
              </div>

              {features.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    What you get
                  </h2>

                  <div className="mt-4 space-y-3">
                    {features.map((feature, index) => (
                      <div
                        key={`${product.id}-feature-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />

                        <span className="text-sm leading-6 text-slate-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy */}
              <div className="mt-auto pt-9">
                <button
                  onClick={handleBuyNow}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-4 text-sm font-black text-white shadow-[0_15px_45px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(124,58,237,0.4)]"
                >
                  <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Buy Now
                </button>

                <p className="mt-3 text-center text-xs text-slate-500">
                  You will enter your Minecraft username in the next step.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};