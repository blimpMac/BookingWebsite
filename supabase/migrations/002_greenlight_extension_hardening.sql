-- Applied in the Greenlight Booking Supabase project after the initial booking schema.
-- Keep extension objects out of the publicly exposed schema.
-- btree_gist is relocatable; existing exclusion constraint keeps its dependencies.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;
