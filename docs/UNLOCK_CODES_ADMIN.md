# Admin Guide: Unlock Codes for Super Thanks Supporters

## What are unlock codes?

Unlock codes are one-time use redemption codes that fully unlock all creature packages for a player. They're intended as a reward for Super Thanks channel supporters.

When a player redeems a valid code:
- All regions (6) and all packages within those regions are marked as completed
- No progress reset happens — the player keeps their creature collection, XP, stats
- The code becomes bound to that player's account (stored in Supabase, survives device wipes/reinstalls)

## Database Setup

Run this SQL migration in Supabase SQL Editor:

```sql
-- See data/sqls/create_unlock_codes_table.sql
```

The `unlock_codes` table has:
- `code` (unique, e.g. `DMM-7KX9QA`)
- `used_by_player_id` (null until redeemed)
- `used_at` (timestamp when redeemed)
- `created_at` (when code was generated)

## Generating Unlock Codes

Currently, unlock codes are generated manually. Use the Supabase web UI (Database → unlock_codes) or run:

```sql
INSERT INTO unlock_codes (code) VALUES ('DMM-ABC123');
```

Code format recommendations:
- Prefix: `DMM-` (Dínók Meg Minden)
- Body: 6 alphanumeric characters (e.g. `7KX9QA`)
- Use UPPERCASE (the app auto-converts input to uppercase)
- Suggested pattern: Generate with cryptographic randomness to avoid collisions

### Example: Bulk Insert

```sql
INSERT INTO unlock_codes (code) VALUES
  ('DMM-7KX9QA'),
  ('DMM-B2P4RT'),
  ('DMM-N8M5XJ'),
  ('DMM-Q6Z1LD'),
  ('DMM-H3G2VC');
```

## Player Redemption Flow

1. Player opens the app, navigates to Dashboard (account icon)
2. Scrolls to "🎁 Kód beváltása" section
3. Pastes/enters the code (case-insensitive, whitespace trimmed)
4. Taps "Beváltás" button
5. If successful: celebration animation, all packages unlocked immediately
6. The code is now permanently bound to that player — cannot be reused

## Troubleshooting

**Code not found / already used error:**
- The code doesn't exist, or
- The code was already redeemed by another player

**"Error occurred" (retry message):**
- Network issue or Supabase API error
- Check Supabase logs; player can retry

**Code was redeemed but progress didn't sync:**
- If the player switches devices or reinstalls: the unlock is persistent in Supabase
- On app launch, `hasFullUnlock()` checks the database and restores the unlock state
- May take a few seconds on slow connections; player can close/reopen the app

## Testing

To test locally during development:

1. Create a test code manually in Supabase (e.g., `DMM-TEST1`)
2. Run the app with a test nickname
3. Open Dashboard → Kód beváltása
4. Enter the code
5. Confirm: all regions/packages should unlock + celebration fires
6. Try entering the same code again → should get "already used" error

## Security Notes

- Codes are one-time use only, enforced by `WHERE used_by_player_id IS NULL` in the UPDATE query
- Postgres row-level locking ensures race conditions are handled atomically
- No need for separate "reserved" flag — the database transaction handles it
