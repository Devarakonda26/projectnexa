-- Test helpers + fixture users. Runs first (files execute in alphabetical order).
-- Roles are switched with SET LOCAL ROLE and JWT claims, the same mechanism PostgREST uses.

create schema if not exists test;
grant usage on schema test to public;

create or replace function test.as_postgres() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function test.as_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

create or replace function test.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
                     json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

-- service_role: server-side key. No `sub`, bypasses RLS.
create or replace function test.as_service() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  set local role service_role;
end $$;

create or replace function test.assert(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'ASSERTION FAILED: %', p_msg;
  end if;
end $$;

create or replace function test.count(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  return n;
end $$;

-- Passes only if the statement raises an error whose message or SQLSTATE matches p_expect.
create or replace function test.throws(p_sql text, p_expect text) returns void language plpgsql as $$
declare
  v_raised boolean := false;
  v_msg    text;
  v_state  text;
begin
  begin
    execute p_sql;
  exception when others then
    v_raised := true;
    get stacked diagnostics v_msg = message_text;
    v_state := sqlstate;
  end;
  if not v_raised then
    raise exception 'ASSERTION FAILED: expected error /%/ but statement succeeded: %', p_expect, p_sql;
  end if;
  if v_msg !~* p_expect and v_state <> p_expect then
    raise exception 'ASSERTION FAILED: expected error /%/ but got [%] %  -- in: %', p_expect, v_state, v_msg, p_sql;
  end if;
end $$;

-- ---------------------------------------------------------------- fixtures
-- Inserting into auth.users fires handle_new_user(), which creates the profile.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@example.test', '{"full_name":"Alice Customer"}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@example.test',   '{"full_name":"Bob Customer"}'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin@example.test', '{"full_name":"Store Admin"}')
on conflict (id) do nothing;

-- Promotion happens from SQL (no JWT), exactly as docs/ADMIN.md instructs.
update public.profiles set role = 'admin' where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

do $$
begin
  perform test.assert((select count(*) from public.profiles) = 3, 'signup trigger should create 3 profiles');
  perform test.assert((select full_name from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') = 'Alice Customer',
                      'profile full_name copied from signup metadata');
  perform test.assert((select role from public.profiles where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc') = 'admin', 'admin promoted');
  raise notice 'PASS t_00: helpers and fixtures';
end $$;
