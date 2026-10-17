import type { ActivityType } from '@dlos/shared';
import { and, eq } from 'drizzle-orm';
import { nowIso, type AppContext } from '../../core/context';
import { progressEvents } from '../../core/db/schema';

export function recordEvent(
  ctx: AppContext,
  event: {
    type: ActivityType;
    entityType: string;
    entityId: number | null;
    localDate: string;
    payload: Record<string, unknown>;
  },
): void {
  const now = nowIso(ctx);
  ctx.db
    .insert(progressEvents)
    .values({
      userId: ctx.userId,
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload,
      occurredAt: now,
      localDate: event.localDate,
      createdAt: now,
    })
    .run();
}

export function removeEvents(
  ctx: AppContext,
  type: ActivityType,
  entityType: string,
  entityId: number,
): void {
  ctx.db
    .delete(progressEvents)
    .where(
      and(
        eq(progressEvents.userId, ctx.userId),
        eq(progressEvents.eventType, type),
        eq(progressEvents.entityType, entityType),
        eq(progressEvents.entityId, entityId),
      ),
    )
    .run();
}
