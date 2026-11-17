export function isExternalMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
        : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const videoId =
        url.searchParams.get('v') ??
        url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return videoId
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
        : null;
    }

    if (host === 'vimeo.com') {
      const videoId = url.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1];
      return videoId
        ? `https://player.vimeo.com/video/${videoId}`
        : null;
    }

    return null;
  } catch {
    return null;
  }
}
