-- Hides (archives) the robotics and drone projects from the public store. Nothing is deleted.
-- To bring them back later, change 'archived' to 'published' and run it again.
update public.products
   set status = 'archived'
 where slug in (
   'drone-flight-controller-design',
   'drone-flight-data-visualization-analysis',
   'robotic-pick-and-place-arm',
   'line-follower-robot-kit',
   'robotic-arm-4dof-kit',
   'autonomous-line-following-robot'
 );
