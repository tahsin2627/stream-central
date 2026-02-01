interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export const VideoPlayer = ({ tmdbId, mediaType, season, episode }: VideoPlayerProps) => {
  // Build the embed URL using the correct autoembed player format
  let embedUrl = `https://player.autoembed.cc/embed/${mediaType}/${tmdbId}`;
  
  // Add season/episode for TV shows
  if (mediaType === 'tv' && season && episode) {
    embedUrl += `/${season}/${episode}`;
  }

  return (
    <div className="relative w-full h-full bg-black">
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
