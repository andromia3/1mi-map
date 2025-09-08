"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import MapView from '@/components/MapView';

export default function Map1MI({ user }: { user: { id: string; email?: string; user_metadata?: { display_name?: string } } }) {
  // In case we later split MapView internals, keep wrapper stable
  const u = useMemo(() => user, [user]);
  return <MapView user={u} />;
}


