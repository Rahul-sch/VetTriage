# Supabase Migrations

## Setup

Run the migration to create the `visits` table:

```sql
-- See migrations/001_create_visits_table.sql
```

Or run via Supabase CLI:
```bash
supabase db push
```

## Environment Variables

Make sure these are set in your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

