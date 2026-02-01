interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export const VideoPlayer = ({ tmdbId, mediaType, season, episode }: VideoPlayerProps) => {
  // Build the embed URL based on media type
  let embedUrl = `https://watch-v2.autoembed.cc/${mediaType}/${tmdbId}`;
  
  // Add season/episode for TV shows
  if (mediaType === 'tv' && season && episode) {
    embedUrl += `/${season}/${episode}`;
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="origin"
        title="Video Player"
      />
    </div>
  );
};
