import { useEffect, useState } from 'react';

import { api } from './api';
import type { Photo, Profile } from './types';

// Small in-memory caches so lists don't refetch the same member's profile and photos
// every time a card scrolls back into view.
const profileCache = new Map<number, Profile>();
const photoCache = new Map<number, Photo[]>();
const inflightProfiles = new Map<number, Promise<Profile>>();
const inflightPhotos = new Map<number, Promise<Photo[]>>();

export function rememberProfiles(list: Profile[]) {
  for (const p of list) profileCache.set(p.user.id, p);
}

export function fetchProfile(userId: number, force = false): Promise<Profile> {
  const cached = profileCache.get(userId);
  if (cached && !force) return Promise.resolve(cached);
  let p = inflightProfiles.get(userId);
  if (!p) {
    p = api
      .get<Profile>(`/profiles/user/${userId}`)
      .then((res) => {
        profileCache.set(userId, res);
        return res;
      })
      .finally(() => inflightProfiles.delete(userId));
    inflightProfiles.set(userId, p);
  }
  return p;
}

export function fetchPhotos(userId: number, force = false): Promise<Photo[]> {
  const cached = photoCache.get(userId);
  if (cached && !force) return Promise.resolve(cached);
  let p = inflightPhotos.get(userId);
  if (!p) {
    p = api
      .get<Photo[]>(`/photos/user/${userId}`)
      .then((res) => {
        const sorted = [...res].sort(
          (a, b) => Number(b.primaryPhoto) - Number(a.primaryPhoto) || a.sortOrder - b.sortOrder,
        );
        photoCache.set(userId, sorted);
        return sorted;
      })
      .finally(() => inflightPhotos.delete(userId));
    inflightPhotos.set(userId, p);
  }
  return p;
}

export function useUserProfile(userId?: number) {
  const [profile, setProfile] = useState<Profile | undefined>(() =>
    userId ? profileCache.get(userId) : undefined,
  );
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchProfile(userId)
      .then((p) => alive && setProfile(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);
  return profile;
}

export function usePhotos(userId?: number) {
  const [photos, setPhotos] = useState<Photo[] | undefined>(() =>
    userId ? photoCache.get(userId) : undefined,
  );
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchPhotos(userId)
      .then((p) => alive && setPhotos(p))
      .catch(() => alive && setPhotos([]));
    return () => {
      alive = false;
    };
  }, [userId]);
  return photos;
}

export function usePrimaryPhoto(userId?: number): string | undefined {
  return usePhotos(userId)?.[0]?.url;
}
