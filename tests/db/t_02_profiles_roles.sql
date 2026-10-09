-- Role escalation must be impossible from a user session.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
begin
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.profiles') = 1, 'customer sees only their own profile');
  update public.profiles set full_name = 'Alice Renamed', phone = '9123456780' where id = alice;
  perform test.assert((select full_name from public.profiles where id = alice) = 'Alice Renamed', 'customer can edit own name');

  -- the classic attack: make myself an admin
  perform test.throws('update public.profiles set role = ''admin'' where id = ''' || alice || '''', '42501');
  perform test.throws('insert into public.profiles (id, role) values (gen_random_uuid(), ''admin'')', '42501');

  -- editing someone else's profile affects nothing
  update public.profiles set full_name = 'Pwned' where id = bob;
  perform test.as_postgres();
  perform test.assert((select full_name from public.profiles where id = bob) = 'Bob Customer', 'cannot edit another profile');
  perform test.assert((select role from public.profiles where id = alice) = 'customer', 'alice is still a customer');

  -- defence in depth: even if a grant were widened, the trigger blocks role changes from any user session
  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);
  perform test.throws('update public.profiles set role = ''admin'' where id = ''' || alice || '''', '42501');
  perform test.as_postgres();

  -- even an existing admin cannot grant roles from the app
  perform test.as_user(admin);
  perform test.throws('update public.profiles set role = ''admin'' where id = ''' || bob || '''', '42501');
  perform test.assert(test.count('select 1 from public.profiles') = 3, 'admin can read all profiles');

  -- legitimate promotion from SQL (service role / SQL editor, no user JWT) is audited
  perform test.as_postgres();
  update public.profiles set role = 'admin' where id = bob;
  perform test.assert(test.count('select 1 from public.audit_log where action = ''profiles.update'' and entity_id = ''' || bob || '''') = 1,
                      'role change recorded in audit_log');
  update public.profiles set role = 'customer' where id = bob;

  raise notice 'PASS t_02: profiles and roles';
end $$;

rollback;
