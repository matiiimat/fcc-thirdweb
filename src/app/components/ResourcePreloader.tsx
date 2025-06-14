"use client";

import { useEffect } from "react";

interface ResourcePreloaderProps {
  resources?: string[];
}

export default function ResourcePreloader({ resources = [] }: ResourcePreloaderProps) {
  useEffect(() => {
    // Preload critical resources during app initialization
    const preloadResources = async () => {
      const defaultResources = [
        // Preload critical API endpoints
        '/api/players',
        '/api/notifications',
        // Preload critical images
        '/icons/ball-icon.png',
        '/icons/player-icon.png',
        '/icons/mail-icon.png',
      ];

      const allResources = [...defaultResources, ...resources];

      // Use requestIdleCallback to preload during idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          allResources.forEach(resource => {
            if (resource.startsWith('/api/')) {
              // Prefetch API endpoints
              fetch(resource, { 
                method: 'HEAD',
                cache: 'force-cache'
              }).catch(() => {
                // Ignore errors for prefetch
              });
            } else if (resource.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
              // Preload images
              const img = new Image();
              img.src = resource;
            }
          });
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          allResources.forEach(resource => {
            if (resource.startsWith('/api/')) {
              fetch(resource, { 
                method: 'HEAD',
                cache: 'force-cache'
              }).catch(() => {});
            } else if (resource.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
              const img = new Image();
              img.src = resource;
            }
          });
        }, 100);
      }
    };

    preloadResources();
  }, [resources]);

  // This component doesn't render anything
  return null;
}