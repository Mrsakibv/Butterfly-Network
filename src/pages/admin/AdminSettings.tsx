import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';

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
}

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
        .single();

      if (!error && data) setSettings(data as SiteSettings);
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

    const { error } = await supabase
      .from('site_settings')
      .update(settings)
      .eq('id', true);

    setSaving(false);
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
  ];

  return (
    <AdminLayout active="settings">
      <h2 className="mb-6 text-2xl font-bold">Site Settings</h2>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs text-slate-500">{field.label}</label>
            <input
              type={field.type ?? 'text'}
              value={settings[field.key] as any}
              onChange={(e) =>
                handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
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