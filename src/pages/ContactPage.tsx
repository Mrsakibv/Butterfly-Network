import React, { useEffect } from 'react';
import { Mail, MapPin, MessageCircle, ExternalLink, Globe, Headphones, Link, Users } from 'lucide-react';
import { SERVER_CONFIG } from '../config/server';
import { usePageItems } from '../hooks/usePageItems';

export const ContactPage: React.FC = () => {
  const pageItems = usePageItems('contact');

  const iconMap = { discord: MessageCircle, mail: Mail, location: MapPin, globe: Globe, support: Headphones, link: Link, users: Users };
  const normalizeContactLink = (value: string) => {
    const link = value.trim();
    if (!link || link.startsWith('/') || link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('tel:')) {
      return link;
    }
    return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  };

  useEffect(() => {
    document.title = 'Contact | Butterfly Network';
  }, []);

  const defaultContactCards = [
    {
      title: 'Discord',
      description: 'Fastest way to reach support, report players, or ask questions.',
      value: 'Join Discord',
      href: SERVER_CONFIG.discordUrl,
      imageUrl: '',
      icon: MessageCircle,
    },
    {
      title: 'Email',
      description: 'For business, sponsorship, or serious support requests.',
      value: 'admin@butterflynetwork.com',
      href: 'mailto:admin@butterflynetwork.com',
      imageUrl: '',
      icon: Mail,
    },
    {
      title: 'Server',
      description: 'The main community hub for announcements and updates.',
      value: SERVER_CONFIG.serverName,
      href: SERVER_CONFIG.discordUrl,
      imageUrl: '',
      icon: MapPin,
    },
  ];
  const contactCards = pageItems.length > 0 ? pageItems.map((item, index) => ({
    title: item.title,
    description: item.description,
    value: item.subtitle,
    href: normalizeContactLink(item.link_url),
    imageUrl: item.image_url,
    icon: iconMap[item.extra?.icon as keyof typeof iconMap] || [MessageCircle, Mail, MapPin][index % 3],
  })) : defaultContactCards;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <Mail className="h-3.5 w-3.5 text-purple-400" />
            Contact Us
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Need help or want to talk to the team?
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Reach out through our official channels. We’re always available to help members, answer questions, and support the community.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {contactCards.map(({ title, description, value, href, imageUrl, icon: Icon }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-purple-500/40 hover:bg-purple-500/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                {imageUrl ? <img src={imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <Icon className="h-5 w-5" />}
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{description}</p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-purple-300">
                <span>{value}</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
