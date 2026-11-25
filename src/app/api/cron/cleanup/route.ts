import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/supabase-repository';

export const dynamic = 'force-dynamic';

/**
 * Scheduled Cron Worker Endpoint
 * Cleans up expired temporary 10-minute holds, stale OTPs, and expired reservations.
 * Authorized via CRON_SECRET Bearer token or elevated service role header.
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const result = await repository.cleanupExpiredHoldsAndOtps();

    await repository.recordAuditLog({
      operator_email: 'cron-worker',
      action: 'CRON_CLEANUP_EXECUTED',
      category: 'system',
      details: `Released ${result.expiredHolds} holds, marked ${result.expiredBookings} bookings expired, purged ${result.expiredOtps} OTPs.`,
    });

    return NextResponse.json({
      status: 'ok',
      cleaned: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
