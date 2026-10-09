-- Custom project requests: ownership, attachments, quotations, approvals, milestones.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_branch uuid; req uuid; quote1 uuid; quote2 uuid; ms uuid;
begin
  select id into v_branch from public.branches where slug = 'robotics';

  -- ---------- submitting a request
  perform test.as_user(alice);
  perform test.throws('insert into public.custom_requests (user_id, title, branch_id, description, status) values (''' || alice || ''', ''Self-balancing robot'', ''' || v_branch || ''', ''A self balancing two wheel robot with PID control and a phone app for tuning.'', ''accepted'')', '42501');   -- cannot pre-approve own request
  perform test.throws('insert into public.custom_requests (user_id, title, branch_id, description) values (''' || bob || ''', ''Self-balancing robot'', ''' || v_branch || ''', ''A self balancing two wheel robot with PID control and a phone app for tuning.'')', '42501');          -- cannot file as someone else
  perform test.throws('insert into public.custom_requests (user_id, title, branch_id, description) values (''' || alice || ''', ''Hi'', ''' || v_branch || ''', ''too short'')', '23514');
  perform test.throws('insert into public.custom_requests (user_id, title, branch_id, description, budget_min_paise, budget_max_paise) values (''' || alice || ''', ''Self-balancing robot'', ''' || v_branch || ''', ''A self balancing two wheel robot with PID control and a phone app for tuning.'', 900000, 100000)', '23514');

  insert into public.custom_requests (user_id, title, branch_id, description, requirements, budget_min_paise, budget_max_paise, deadline)
  values (alice, 'Self-balancing robot', v_branch,
          'A self balancing two wheel robot with PID control and a phone app for tuning.',
          'Bluetooth control, 2 hours battery.', 500000, 1000000, current_date + 45)
  returning id into req;

  perform test.assert((select status from public.custom_requests where id = req) = 'submitted', 'new request is submitted');
  perform test.assert((select request_number from public.custom_requests where id = req) ~ '^CR[0-9]{4}[0-9]{5}$', 'request number format');

  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from public.custom_requests') = 0, 'bob cannot see alice''s request');
  perform test.throws('select public.cancel_custom_request(''' || req || ''')', 'request_not_cancellable');

  -- ---------- attachments: own folder + allowed type + size cap
  perform test.as_user(alice);
  perform test.throws('insert into public.request_attachments (request_id, uploaded_by, storage_path, file_name, size_bytes, content_type) values (''' || req || ''', ''' || alice || ''', ''' || bob || '/' || req || '/spec.pdf'', ''spec.pdf'', 1000, ''application/pdf'')', '42501');
  perform test.throws('insert into public.request_attachments (request_id, uploaded_by, storage_path, file_name, size_bytes, content_type) values (''' || req || ''', ''' || alice || ''', ''' || alice || '/' || req || '/virus.exe'', ''virus.exe'', 1000, ''application/x-msdownload'')', '23514');
  perform test.throws('insert into public.request_attachments (request_id, uploaded_by, storage_path, file_name, size_bytes, content_type) values (''' || req || ''', ''' || alice || ''', ''' || alice || '/' || req || '/big.pdf'', ''big.pdf'', 99999999, ''application/pdf'')', '23514');
  insert into public.request_attachments (request_id, uploaded_by, storage_path, file_name, size_bytes, content_type)
  values (req, alice, alice || '/' || req || '/spec.pdf', 'spec.pdf', 120000, 'application/pdf');
  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from public.request_attachments') = 0, 'bob cannot see alice''s attachments');
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from public.request_attachments') = 1, 'admin sees attachments');

  -- ---------- staff-only notes stay private
  insert into public.request_admin_notes (request_id, author_id, note) values (req, admin, 'Customer budget looks tight');
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.request_admin_notes') = 0, 'customer cannot read staff notes');
  perform test.throws('insert into public.request_admin_notes (request_id, note) values (''' || req || ''', ''hello'')', '42501');

  -- ---------- quotation workflow
  perform test.throws('insert into public.request_quotes (request_id, amount_paise, scope) values (''' || req || ''', 1, ''pwn'')', '42501');
  perform test.as_user(admin);
  insert into public.request_quotes (request_id, amount_paise, scope, delivery_days, valid_until, status, created_by)
  values (req, 850000, 'Design, build and test of the robot with source code and documentation.', 30, current_date + 7, 'draft', admin)
  returning id into quote1;
  perform test.assert((select status from public.custom_requests where id = req) = 'submitted', 'draft quote does not change the request');

  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.request_quotes') = 0, 'draft quotes are invisible to the customer');
  perform test.throws('select public.respond_to_quote(''' || quote1 || ''', true)', 'quote_not_found');

  perform test.as_user(admin);
  update public.request_quotes set status = 'sent' where id = quote1;
  perform test.assert((select status from public.custom_requests where id = req) = 'quoted', 'sending a quote moves the request to quoted');

  perform test.as_user(bob);
  perform test.throws('select public.respond_to_quote(''' || quote1 || ''', true)', 'quote_not_found');

  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.request_quotes') = 1, 'customer sees the sent quote');
  -- Tampering with the quote: UPDATE is granted for admins, so RLS filters the customer to zero rows.
  update public.request_quotes set amount_paise = 1 where id = quote1;
  perform test.as_postgres();
  perform test.assert((select amount_paise from public.request_quotes where id = quote1) = 850000, 'customer cannot edit the quoted amount');
  perform test.as_user(alice);
  perform public.respond_to_quote(quote1, true);
  perform test.assert((select status from public.request_quotes where id = quote1) = 'accepted', 'quote accepted');
  perform test.assert((select status from public.custom_requests where id = req) = 'accepted', 'request accepted');
  perform test.throws('select public.respond_to_quote(''' || quote1 || ''', false)', 'quote_not_open');
  perform test.throws('select public.cancel_custom_request(''' || req || ''')', 'request_not_cancellable');

  -- expired quotes cannot be accepted
  perform test.as_user(admin);
  insert into public.request_quotes (request_id, amount_paise, scope, status, valid_until, created_by)
  values (req, 100000, 'Late optional add-on that already expired.', 'sent', current_date - 1, admin) returning id into quote2;
  perform test.as_user(alice);
  perform public.respond_to_quote(quote2, true);
  perform test.assert((select status from public.request_quotes where id = quote2) = 'expired', 'expired quote is marked expired, not accepted');

  -- ---------- milestones
  perform test.as_user(admin);
  perform test.throws('update public.custom_requests set status = ''completed'' where id = ''' || req || '''', 'invalid_request_transition');
  update public.custom_requests set status = 'in_progress' where id = req;
  insert into public.request_milestones (request_id, title, amount_paise, due_date, sort_order)
  values (req, 'Mechanical build complete', 300000, current_date + 15, 10) returning id into ms;

  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.request_milestones') = 1, 'customer sees milestones');
  perform test.throws('select public.approve_milestone(''' || ms || ''')', 'milestone_not_approvable');             -- not submitted yet
  update public.request_milestones set status = 'approved', is_paid = true, paid_reference = 'FAKE' where id = ms;   -- RLS filters to zero rows
  perform test.as_postgres();
  perform test.assert((select status from public.request_milestones where id = ms) = 'pending'
                      and not (select is_paid from public.request_milestones where id = ms), 'customer cannot approve or mark paid by direct UPDATE');
  perform test.as_user(alice);
  perform test.throws('select public.admin_mark_milestone_paid(''' || ms || ''', ''FAKE-REF'')', 'forbidden');

  perform test.as_user(admin);
  update public.request_milestones set status = 'submitted', submitted_at = now() where id = ms;
  perform test.as_user(bob);
  perform test.throws('select public.approve_milestone(''' || ms || ''')', 'milestone_not_approvable');             -- not bob's request
  perform test.as_user(alice);
  perform public.approve_milestone(ms);
  perform test.assert((select status from public.request_milestones where id = ms) = 'approved', 'customer approved the milestone');

  perform test.as_user(admin);
  perform test.throws('select public.admin_mark_milestone_paid(''' || ms || ''', ''x'')', 'reference_required');
  perform public.admin_mark_milestone_paid(ms, 'UTR778899001122');
  perform test.assert((select is_paid from public.request_milestones where id = ms), 'staff recorded the milestone payment');
  perform test.throws('select public.admin_mark_milestone_paid(''' || ms || ''', ''UTR778899001122'')', 'milestone_not_found_or_already_paid');

  perform test.as_postgres();
  perform test.assert(test.count('select 1 from public.audit_log where entity_type in (''request_quotes'', ''request_milestones'', ''custom_requests'')') >= 5,
                      'quote, milestone and request changes are audited');

  raise notice 'PASS t_05: custom requests';
end $$;

rollback;
