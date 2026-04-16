"use client";

import { useEffect, useRef } from "react";

const DEFAULT_RESOURCES = [
  '/icons/ball-icon.png',
  '/icons/player-icon.png',
  '/icons/mail-icon.png',
];

interface ResourcePreloaderProps {
  resources?: string[];
}

export default function ResourcePreloader({ resources }: ResourcePreloaderProps) {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const allResources = resources ? [...DEFAULT_RESOURCES, ...resources] : DEFAULT_RESOURCES;

    const preload = () => {
      allResources.forEach(resource => {
        if (resource.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
          const img = new window.Image();
          img.src = resource;
        }
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }
  }, [resources]);

  return null;
}