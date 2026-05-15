import React, { useState, useEffect } from 'react';

const BACKGROUNDS = [
  {
    id: 'scifi-nebula',
    // Dark space nebula
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1920&auto=format&fit=crop',
    // Shift towards vibrant blue to match the app's theme
    style: { filter: 'blur(4px) brightness(0.5) contrast(1.2) hue-rotate(180deg)' } 
  },
  {
    id: 'fantasy-fog',
    // Dark misty mountains and forest
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1920&auto=format&fit=crop',
    // Gritty muddy red/brown for a grimdark fantasy feel
    style: { filter: 'blur(4px) brightness(0.4) contrast(1.3) sepia(0.4) hue-rotate(-10deg)' } 
  },
  {
    id: 'war-sparks',
    // Sparks flying in the dark
    url: 'https://images.unsplash.com/photo-1542261777448-23d2a287091c?q=80&w=1920&auto=format&fit=crop',
    // High contrast fire and sparks
    style: { filter: 'blur(3px) brightness(0.4) contrast(1.5) saturate(1.2)' } 
  },
  {
    id: 'industrial-ruin',
    // Dark industrial ruins
    url: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?q=80&w=1920&auto=format&fit=crop',
    // Gritty, cold blue/gray industrial vibe
    style: { filter: 'blur(4px) brightness(0.4) contrast(1.2) saturate(0.6) hue-rotate(190deg)' } 
  }
];

export function Background() {
  // Initialize with a random background immediately to avoid flashes
  const [bg] = useState(() => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = bg.url;
    img.onload = () => setLoaded(true);
    // If it fails, we still show the gradient/overlay so it's not just black
    img.onerror = () => setLoaded(true);
  }, [bg.url]);

  return (
    <>
      {/* Base layer with a deep space/grimdark gradient fallback */}
      <div 
        className="fixed inset-0 z-[-3] bg-zinc-950" 
        style={{
          background: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)'
        }}
      />
      
      {/* Blurred image layer */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `url(${bg.url})`,
          transform: 'scale(1.1)', 
          opacity: loaded ? 1 : 0,
          ...bg.style
        }}
      />
      
      {/* Vignette and grain overlay to unify the look */}
      <div className="fixed inset-0 z-[-1] bg-zinc-950/20 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </>
  );
}
