import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';

interface SiteSettings {
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  java_ip: string;
  bedrock_ip: string;
  port: number;
  bedrock_port: number;
  version: string;
  discord_url: string;
  facebook_url: string;
  tiktok_url: string;
  twitter_url: string;
  store_url: string;
  vote_url: string;
  server_status_api: string;
  copyright_year: number;
  hero_background_image_url: string;
  hero_kicker: string;
  hero_kicker_version: string;
  hero_title_prefix: string;
  hero_title_main: string;
  hero_subtitle: string;
  hero_description: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'Butterfly Network',
  tagline: 'Your next Minecraft adventure starts here :)',
  logo_url: '',
  favicon_url: '',
  java_ip: 'play.firemc.fun',
  bedrock_ip: 'play.firemc.fun',
  port: 25565,
  bedrock_port: 19132,
  version: '1.8.x - 1.21.x',
  discord_url: 'https://discord.com/invite/d57g4gjXuc',
  facebook_url: 'https://www.facebook.com/mrsakib232/',
  tiktok_url: 'https://www.tiktok.com/@mrsakib.232?is_from_webapp=1&sender_device=pc',
  twitter_url: 'https://x.com/Mrsakib_',
  store_url: '#',
  vote_url: '#',
  server_status_api: 'https://api.mcstatus.io/v2/status/java/play.firemc.fun',
  copyright_year: 2026,
  hero_background_image_url: '',
  hero_kicker: 'Next-Gen Minecraft Multiplayer',
  hero_kicker_version: 'v1.8.x - 1.21.x',
  hero_title_prefix: 'Welcome to',
  hero_title_main: 'Butterfly Network',
  hero_subtitle: 'Your next Minecraft adventure starts here :)',
  hero_description: 'Join Butterfly Network and experience an exciting Minecraft network featuring multiple game modes, an active community and an unforgettable adventure.',
};

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        setSettings(defaultSettings);
      } else if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
        } as SiteSettings);
      } else {
        setSettings(defaultSettings);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (key: keyof SiteSettings, value: string | number) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');

    const normalized = {
      ...settings,
      hero_kicker: settings.hero_kicker?.trim() || defaultSettings.hero_kicker,
      hero_kicker_version: settings.hero_kicker_version?.trim() || defaultSettings.hero_kicker_version,
      hero_title_prefix: settings.hero_title_prefix?.trim() || defaultSettings.hero_title_prefix,
      hero_title_main: settings.hero_title_main?.trim() || defaultSettings.hero_title_main,
      hero_subtitle: settings.hero_subtitle?.trim() || defaultSettings.hero_subtitle,
      hero_description: settings.hero_description?.trim() || defaultSettings.hero_description,
      hero_background_image_url: settings.hero_background_image_url?.trim() || defaultSettings.hero_background_image_url,
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: true, ...normalized })
      .eq('id', true);

    setSaving(false);
    if (!error) {
      await logAdminActivity({
        action: 'updated',
        section: 'Site Settings',
        itemName: normalized.site_name,
        details: normalized,
      });
    }
    setMessage(error ? `Error: ${error.message}` : 'Settings saved. Refresh the site to see changes.');
  };

  if (loading || !settings) {
    return (
      <AdminLayout active="settings">
        <p className="text-slate-400">Loading...</p>
      </AdminLayout>
    );
  }

  const fields: { key: keyof SiteSettings; label: string; type?: string }[] = [
    { key: 'site_name', label: 'Site Name' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'logo_url', label: 'Logo URL' },
    { key: 'favicon_url', label: 'Favicon URL' },
    { key: 'java_ip', label: 'Java IP' },
    { key: 'bedrock_ip', label: 'Bedrock IP' },
    { key: 'port', label: 'Java Port', type: 'number' },
    { key: 'bedrock_port', label: 'Bedrock Port', type: 'number' },
    { key: 'version', label: 'Minecraft Version' },
    { key: 'discord_url', label: 'Discord URL' },
    { key: 'facebook_url', label: 'Facebook URL' },
    { key: 'tiktok_url', label: 'TikTok URL' },
    { key: 'twitter_url', label: 'Twitter/X URL' },
    { key: 'store_url', label: 'Store URL' },
    { key: 'vote_url', label: 'Vote URL' },
    { key: 'server_status_api', label: 'Server Status API' },
    { key: 'copyright_year', label: 'Copyright Year', type: 'number' },
    { key: 'hero_background_image_url', label: 'Homepage Background Image URL' },
    { key: 'hero_kicker', label: 'Hero Badge Text' },
    { key: 'hero_kicker_version', label: 'Hero Badge Version' },
    { key: 'hero_title_prefix', label: 'Hero Title Prefix' },
    { key: 'hero_title_main', label: 'Hero Title Main' },
    { key: 'hero_subtitle', label: 'Hero Subtitle' },
    { key: 'hero_description', label: 'Hero Description' },
  ];

  return (
    <AdminLayout active="settings" permission="settings">
      <h2 className="mb-6 text-2xl font-bold">Site Settings</h2>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <div className="mb-1 flex items-center gap-2">
              <label className="block text-xs text-slate-500">{field.label}</label>
              {field.key === 'hero_background_image_url' && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                  URL Recommended
                </span>
              )}
            </div>
            <input
              type={field.type ?? 'text'}
              value={settings[field.key] as any}
              onChange={(e) =>
                handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
            {field.key === 'hero_background_image_url' && (
              <>
                <p className="mt-1 text-xs text-emerald-300/80">
                  Use a direct public image URL for the clearest homepage background. PNG, JPG, or WEBP works best.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Upload the image to <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">ImgBB</a>, <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">Postimages</a>, or <a href="https://myimgs.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">MyImgs</a>, copy the direct image URL, then paste it above.
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </AdminLayout>
  );
};