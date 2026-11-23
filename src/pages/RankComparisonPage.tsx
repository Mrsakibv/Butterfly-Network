import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Crown, GitCompareArrows, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';

interface RankProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  currency: string;
  sort_order: number;
}

interface RankFeature {
  id: string;
  name: string;
  sort_order: number;
}

interface FeatureProduct {
  feature_id: string;
  product_id: string;
  details: string | null;
}

function formatPrice(price: number, currency: string) {
  const symbol =
    currency === 'BDT' || currency === '৳'
      ? '৳'
      : currency === 'BFC'
        ? 'BC'
        : currency;
  return `${symbol} ${Number(price).toLocaleString()}`;
}

export const RankComparisonPage: React.FC = () => {
  const { navigate } = useRouter();
  const [ranks, setRanks] = useState<RankProduct[]>([]);
  const [features, setFeatures] = useState<RankFeature[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Map<string, string>>(new Map());
  const [selectedRankIds, setSelectedRankIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Compare Ranks | Butterfly Network';
    let cancelled = false;

    const loadComparison = async () => {
      const [productsResult, featuresResult, assignmentsResult] = await Promise.all([
        supabase
          .from('store_products')
          .select('id,name,slug,category,price,currency,sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('rank_comparison_features')
          .select('id,name,sort_order')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('rank_comparison_feature_products')
          .select('feature_id,product_id,details'),
      ]);

      const failedResult = productsResult.error || featuresResult.error || assignmentsResult.error;
      if (failedResult) {
        console.error('Rank comparison load failed:', failedResult);
        if (!cancelled) {
          setError(failedResult.message);
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      const activeRanks = ((productsResult.data ?? []) as RankProduct[]).filter(
        (product) => ['rank', 'ranks'].includes(product.category.trim().toLowerCase())
      );
      setRanks(activeRanks);
      setSelectedRankIds(activeRanks.map((rank) => rank.id));
      setFeatures((featuresResult.data ?? []) as RankFeature[]);
      setAvailableFeatures(
        new Map(
          ((assignmentsResult.data ?? []) as FeatureProduct[]).map((assignment) => [
            `${assignment.feature_id}:${assignment.product_id}`,
            assignment.details ?? '',
          ])
        )
      );
      setLoading(false);
    };

    void loadComparison();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRanks = ranks.filter((rank) => selectedRankIds.includes(rank.id));

  const toggleRankSelection = (rankId: string) => {
    setSelectedRankIds((current) =>
      current.includes(rankId)
        ? current.filter((id) => id !== rankId)
        : [...current, rankId]
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 text-white">
      <section className="relative py-10">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/store')}
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </button>

          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
              <GitCompareArrows className="h-3.5 w-3.5" />
              Rank comparison
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
              Compare all ranks
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Compare rank prices and see which perks are included with each rank.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              Loading rank comparison...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="font-semibold text-red-300">Could not load rank comparison.</p>
              <p className="mt-2 text-sm text-red-200/70">{error}</p>
              <p className="mt-2 text-xs text-red-200/60">
                Make sure the rank comparison SQL migration has been applied.
              </p>
            </div>
          ) : ranks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
              No active ranks are available to compare.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-white">Choose ranks to compare</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Select the ranks you want to see together.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      {selectedRanks.length} of {ranks.length} selected
                    </span>
                    <button
                      onClick={() => setSelectedRankIds(ranks.map((rank) => rank.id))}
                      className="font-semibold text-purple-300 hover:text-purple-200"
                    >
                      Select all
                    </button>
                    <button
                      onClick={() => setSelectedRankIds([])}
                      className="font-semibold text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ranks.map((rank) => {
                    const selected = selectedRankIds.includes(rank.id);
                    return (
                      <button
                        key={rank.id}
                        onClick={() => toggleRankSelection(rank.id)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                          selected
                            ? 'border-purple-400/40 bg-purple-500/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                        }`}
                      >
                        {selected ? (
                          <Check className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <Crown className="h-4 w-4 text-slate-600" />
                        )}
                        {rank.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRanks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
                  Select at least one rank to see its features.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-20 min-w-56 border-b border-white/10 bg-[#100d19] px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                          Rank features
                        </th>
                        {selectedRanks.map((rank) => (
                          <th
                            key={rank.id}
                            className="min-w-44 border-b border-white/10 bg-[#100d19] px-5 py-4 text-center"
                          >
                            <button
                              onClick={() =>
                                navigate(`/store/product/${encodeURIComponent(rank.slug)}`)
                              }
                              className="group mx-auto flex flex-col items-center gap-2"
                            >
                              <Crown className="h-5 w-5 text-amber-300" />
                              <span className="font-bold text-white group-hover:text-purple-200">
                                {rank.name}
                              </span>
                              <span className="text-xs font-semibold text-purple-300">
                                {formatPrice(rank.price, rank.currency)}
                              </span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {features.length === 0 ? (
                        <tr>
                          <td
                            colSpan={selectedRanks.length + 1}
                            className="px-5 py-10 text-center text-sm text-slate-400"
                          >
                            Rank comparison features have not been added yet.
                          </td>
                        </tr>
                      ) : (
                        features.map((feature, index) => (
                          <tr key={feature.id} className="group">
                            <th className="sticky left-0 z-10 border-b border-white/[0.06] bg-[#0c0a12] px-5 py-4 text-sm font-medium text-slate-200 group-hover:bg-[#15111e]">
                              <span className="mr-3 text-xs text-slate-600">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {feature.name}
                            </th>
                            {selectedRanks.map((rank) => {
                              const key = `${feature.id}:${rank.id}`;
                              const details = availableFeatures.get(key);
                              return (
                                <td
                                  key={key}
                                  className="border-b border-white/[0.06] px-5 py-4 text-center group-hover:bg-white/[0.02]"
                                >
                                  {details === undefined ? (
                                    <span
                                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-slate-600"
                                      aria-label={`Not included with ${rank.name}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </span>
                                  ) : details.trim() ? (
                                    <span className="mx-auto block max-w-48 text-sm text-slate-200">
                                      {details}
                                    </span>
                                  ) : (
                                    <span
                                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300"
                                      aria-label={`Included with ${rank.name}`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
