# Media asset deletion recovery

## Root cause

The previous workflow deleted the `website-media` Storage object first and then
deleted its `public.media_assets` row. If Storage succeeded but PostgREST, RLS, or
the network failed during metadata deletion, the catalogue row remained while the
object was already missing. Retry was possible in some cases, but no durable state
identified which rows needed recovery.

## Workflow

1. The authenticated admin client validates the object path and scans every page of
   `content_records.fields` and `content_revisions.snapshot`. An incomplete scan
   fails closed.
2. It updates the matching `media_assets` row to `deletion_status = 'pending'`
   and sets `deletion_requested_at`. Exactly one returned row is required. Storage
   is not touched if this write fails or cannot be confirmed.
3. A database trigger serializes this transition against CMS/revision writes and
   checks live content and saved revision snapshots again. The transition is rejected
   if the object path (raw or slash-encoded) is referenced.
4. A restrictive anonymous SELECT policy hides pending assets from public catalogue
   reads. Authenticated admins retain access to the row for recovery.
5. Storage deletion uses the signed-in user's access token and existing Storage RLS.
   Confirmed missing objects are treated as idempotent success. Network and other
   failed responses leave the catalogue row pending.
6. Only after Storage deletion is confirmed does the client delete the catalogue row.
   If that database operation fails, the pending row remains as the recovery record.
7. The Media Library shows pending status and a retry control. Retry repeats the
   reference check and status write, then resumes Storage and metadata cleanup.
   Concurrent attempts are safe: Storage removal is retried idempotently and a
   no-row metadata delete is followed by a read to confirm whether the row is gone.
8. Database triggers reject new CMS and revision references to pending assets.

## Security and preservation

- No service-role key or privileged credential is introduced.
- PostgREST and Storage requests continue to use the signed-in user's access token.
- Existing `media_assets` and `storage.objects` RLS policies remain in force.
- The migration adds a restrictive anonymous-read policy only; it adds no grants or
  permissive access policy.
- The existing application reference scan remains as a fail-closed preflight.
- The migration does not delete or rewrite CMS content, revisions, media rows, or
  Storage objects, and is not applied by this PR.
- Existing bucket ownership and delete policies remain unchanged.

## Migration and rollout

Apply `supabase/migrations/20261107100000_media_asset_deletion_recovery.sql` to a
non-production Supabase environment only after reviewing the actual target schema,
RLS policies, trigger inventory, and role visibility. It adds two columns, a check
constraint, a partial index, one restrictive anonymous-read policy, and three
trigger functions/triggers. It must be applied before deploying application code
that writes the new columns.

No migration has been applied to staging or production by this change.

Rollback is not a simple column drop after requests have been made: a pending row may
point to an object that is already absent. Reconcile every pending row against Storage
and complete or explicitly resolve each deletion first. Then remove the triggers,
functions, policy, index, constraint and columns in a separately reviewed rollback.
Never reset pending rows to active blindly.

## Staging verification still required

- Confirm that the target Supabase version supports the policy/trigger syntax and
  that the real admin role can read both CMS tables under existing RLS.
- Verify all CMS serialization variants. The database guard detects raw paths and
  slash-encoded paths; the client scanner additionally URL-decodes strings.
- Exercise concurrent CMS saves and deletion requests against a staging database.
- Confirm the Storage API's exact missing-object response for this bucket. The client
  currently treats HTTP 404 as already deleted; other failures remain pending.
- There is no unattended worker. Pending rows are durable and manually retryable
  from the Media Library; background cleanup is intentionally not introduced.
