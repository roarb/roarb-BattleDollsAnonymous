import React, { useState, useEffect } from 'react';

const BACKGROUNDS = [
  {
    id: 'scifi-nebula',
    // Dark space nebula
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1920&auto=format&fit=crop',
    // Shift towards purple/fuchsia to match the app's theme
    style: { filter: 'blur(4px) brightness(0.5) contrast(1.2) hue-rotate(280deg)' } 
  },
  {
    id: 'fantasy-fog',
    // Dark misty mountains
    url: 'https://images.unsplash.com/photo-1505506876778-7356270bc8cb?q=80&w=1920&auto=format&fit=crop',
    // Gritty muddy red/brown for a grimdark fantasy feel
    style: { filter: 'blur(4px) brightness(0.4) contrast(1.3) sepia(0.4) hue-rotate(-10deg)' } 
  },
  {
    id: 'war-sparks',
    // Sparks flying in the dark
    url: 'https://images.unsplash.com/photo-1542261777448-23d2a287091c?q=80&w=1920&auto=format&fit=crop',
    // High contrast fire and sparks
    style: { filter: 'blur(3px) brightness(0.4) contrast(1.5) saturate(1.2)' } 
  }
];

export function Background() {
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const selected = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    setBg(selected);
    
    const img = new Image();
    img.src = selected.url;
    img.onload = () => setLoaded(true);
  }, []);

  return (
    <>
      {/* Base dark layer */}
      <div className="fixed inset-0 z-[-3] bg-zinc-950" />
      
      {/* Blurred image layer */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${bg.url})`,
          transform: 'scale(1.1)', // Prevent blurred edges from showing background color
          opacity: loaded ? 1 : 0,
          ...bg.style
        }}
      />
      
      {/* Overlay to ensure text readability and add a slight tint */}
      <div className="fixed inset-0 z-[-1] bg-zinc-950/30 pointer-events-none" />
    </>
  );
}
