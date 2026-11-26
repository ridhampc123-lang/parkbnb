import { Suspense } from 'react';
import { repository } from '@/lib/db/supabase-repository';
import { SearchClient } from './search-client';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const approvedSpaces = await repository.getApprovedSpaces();

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
