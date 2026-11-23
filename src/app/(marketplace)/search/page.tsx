import { Suspense } from 'react';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { SearchClient } from './search-client';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  const store = getLocalStore();
  const approvedSpaces = store.getApprovedPublicSpaces();

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchClient initialSpaces={approvedSpaces} />
    </Suspense>
  );
}
