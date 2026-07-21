import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocation(latitude: number, longitude: number): string {
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return 'Unknown Location';
  }
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function extractCoords(post: any): { lat: number; lng: number } | null {
  const lat = post.latitude;
  const lng = post.longitude;
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  const loc = post.Location || '';
  const latMatch = loc.match(/lat[:\s]*([-\d.]+)/i);
  const lngMatch = loc.match(/lng[:\s]*([-\d.]+)/i);
  if (latMatch && lngMatch) {
    return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
  }
  const parts = loc.split(',').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

export function cleanText(text: string) {
  return (text || '').replace(/\s?\(.*?\)/g, '').trim(); // Removes anything inside parentheses
}
