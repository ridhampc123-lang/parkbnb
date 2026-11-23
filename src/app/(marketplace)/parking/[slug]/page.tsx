import Link from 'next/link';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { SpaceDetailClient } from './space-detail-client';
import { Car, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SpacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = getLocalStore();
  const space = store.getSpaceById(slug);

  if (!space) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-muted text-muted-foreground flex items-center justify-center mx-auto">
          <Car className="w-8 h-8 stroke-1" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Parking Space Not Found</h1>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          The requested parking space does not exist or may have been unlisted by the host.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ahmedabad Search</span>
        </Link>
      </div>
    );
  }

  return <SpaceDetailClient space={space} />;
}
