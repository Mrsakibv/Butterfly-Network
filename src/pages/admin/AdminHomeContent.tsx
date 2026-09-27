import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminContentSection } from './AdminContentSection';
import { AdminOffers } from './AdminOffers';
import { LayoutDashboard, Megaphone, Sparkles } from 'lucide-react';

export const AdminHomeContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'slider' | 'offers'>('slider');

  return (
    <AdminLayout active="home">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Home Content Management</h1>
              <p className="text-sm text-slate-400">
                Manage home page sliders, team showcase, and special offers/announcement banners.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 w-fit">
            <button
              onClick={() => setActiveTab('slider')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === 'slider'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Sliders & Team Members</span>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === 'offers'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span>Special Offers & Banners</span>
              <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-black border border-amber-500/30">
                NEW
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'slider' && (
          <div className="pt-2">
            <AdminContentSection
              pageKey="home"
              title="Home Slider & Team Cards"
              description="Manage the character sliders, ranks, social links and introduction texts shown on the homepage."
              hideLayout
            />
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="pt-2">
            <AdminOffers />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
