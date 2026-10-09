-- ProjectNexa seed data (development / demo). Safe to re-run on an empty catalogue.
-- Creates NO users: sign up through the app, then promote your first admin with the SQL in docs/ADMIN.md.
-- The sample products are placeholders; replace them with your real catalogue from the admin dashboard.
-- All prices are in paise (249900 = INR 2,499.00).

insert into public.branches (slug, name, short_name, description, sort_order) values
  ('cse',             'Computer Science & Engineering',        'CSE',        'Software, web, mobile, systems and security projects.', 10),
  ('it',              'Information Technology',                'IT',         'Cloud, databases, networking and enterprise application projects.', 20),
  ('ece',             'Electronics & Communication',           'ECE',        'Embedded systems, IoT, VLSI and communication projects.', 30),
  ('eee',             'Electrical & Electronics',              'EEE',        'Power systems, drives, renewable energy and control projects.', 40),
  ('mechanical',      'Mechanical Engineering',                'Mechanical', 'Design, thermal, manufacturing and CAD/CAM projects.', 50),
  ('civil',           'Civil Engineering',                     'Civil',      'Structural, transportation and environmental projects.', 60),
  ('ai-data-science', 'AI & Data Science',                     'AI/DS',      'Machine learning, deep learning, vision and analytics projects.', 70),
  ('robotics',        'Robotics & Automation',                 'Robotics',   'Robots, manipulators, autonomous vehicles and control projects.', 80),
  ('mechatronics',    'Mechatronics',                          'Mechatronics','Integrated mechanical, electronic and control systems.', 90),
  ('aerospace',       'Aerospace Engineering',                 'Aerospace',  'Drones, flight control and aerodynamics projects.', 100),
  ('automobile',      'Automobile Engineering',                'Automobile', 'EV systems, vehicle dynamics and diagnostics projects.', 110),
  ('biomedical',      'Biomedical Engineering',                'Biomedical', 'Medical instrumentation and health-monitoring projects.', 120),
  ('chemical',        'Chemical Engineering',                  'Chemical',   'Process simulation, reactors and plant design projects.', 130),
  ('instrumentation', 'Instrumentation Engineering',           'Instrumentation','Sensors, measurement and process-control projects.', 140)
on conflict (slug) do nothing;

insert into public.categories (branch_id, slug, name, sort_order)
select b.id, v.slug, v.name, v.sort_order
  from (values
    ('cse', 'web-development',    'Web Development',    10),
    ('cse', 'machine-learning',   'Machine Learning',   20),
    ('cse', 'cybersecurity',      'Cybersecurity',      30),
    ('cse', 'mobile-apps',        'Mobile Apps',        40),
    ('it',  'cloud-computing',    'Cloud Computing',    10),
    ('it',  'database-systems',   'Database Systems',   20),
    ('it',  'networking',         'Networking',         30),
    ('ece', 'iot',                'Internet of Things', 10),
    ('ece', 'embedded-systems',   'Embedded Systems',   20),
    ('ece', 'vlsi',               'VLSI Design',        30),
    ('ece', 'communication-systems','Communication Systems', 40),
    ('eee', 'power-electronics',  'Power Electronics',  10),
    ('eee', 'renewable-energy',   'Renewable Energy',   20),
    ('eee', 'motor-control',      'Motor Control',      30),
    ('mechanical', 'cad-cam',     'CAD / CAM',          10),
    ('mechanical', 'thermal-engineering', 'Thermal Engineering', 20),
    ('mechanical', '3d-printing', '3D Printing',        30),
    ('civil', 'structural-design','Structural Design',  10),
    ('civil', 'transportation',   'Transportation',     20),
    ('civil', 'environmental',    'Environmental',      30),
    ('ai-data-science', 'deep-learning',   'Deep Learning',   10),
    ('ai-data-science', 'computer-vision', 'Computer Vision', 20),
    ('ai-data-science', 'nlp',             'Natural Language Processing', 30),
    ('ai-data-science', 'data-analytics',  'Data Analytics',  40),
    ('robotics', 'line-follower',  'Line Followers',     10),
    ('robotics', 'robotic-arms',   'Robotic Arms',       20),
    ('robotics', 'autonomous-vehicles', 'Autonomous Vehicles', 30),
    ('mechatronics', 'automation', 'Industrial Automation', 10),
    ('aerospace', 'drones',        'Drones & UAVs',      10),
    ('automobile', 'ev-systems',   'EV Systems',         10),
    ('biomedical', 'biomedical-devices', 'Biomedical Devices', 10),
    ('chemical', 'process-simulation', 'Process Simulation', 10),
    ('instrumentation', 'sensors-measurement', 'Sensors & Measurement', 10)
  ) as v(branch_slug, slug, name, sort_order)
  join public.branches b on b.slug = v.branch_slug
on conflict (branch_id, slug) do nothing;

insert into public.products
  (slug, title, summary, description, product_type, status, branch_id, category_id,
   price_paise, mrp_paise, difficulty, tech_stack, tags, weight_grams, cod_eligible, is_featured)
select v.slug, v.title, v.summary, v.description, v.ptype::public.product_type, 'published',
       b.id, c.id, v.price, v.mrp, v.difficulty::public.difficulty_level,
       v.tech, v.tags, v.weight, v.cod, v.featured
  from (values
    ('face-recognition-attendance-system', 'Smart Attendance System using Face Recognition',
     'Python + OpenCV attendance system with a web dashboard, full source code, report and viva questions.',
     'Complete project package: source code, dataset instructions, project report (Word + PDF), PPT, and a viva question bank.',
     'digital', 'ai-data-science', 'computer-vision', 249900, 349900, 'intermediate',
     array['Python','OpenCV','Flask','SQLite'], array['face recognition','attendance','final year'], null::int, false, true),
    ('mern-elearning-platform', 'Full-Stack E-Learning Platform (MERN)',
     'Course marketplace with roles, video lessons, quizzes and progress tracking. Source, report and PPT included.',
     'MongoDB, Express, React and Node.js. Includes deployment guide, API documentation and a project report.',
     'digital', 'cse', 'web-development', 349900, 449900, 'advanced',
     array['MongoDB','Express','React','Node.js'], array['mern','lms','full stack'], null, false, true),
    ('network-intrusion-detection-ml', 'Network Intrusion Detection using Machine Learning',
     'Train and compare classifiers on network traffic data. Notebook, report and presentation included.',
     'Includes preprocessed dataset notes, trained model comparison, report and slides.',
     'digital', 'cse', 'cybersecurity', 299900, null, 'intermediate',
     array['Python','scikit-learn','Pandas'], array['ids','security','ml'], null, false, false),
    ('smart-grid-iot-monitoring', 'Smart Grid Energy Monitoring with IoT',
     'Real-time load and voltage monitoring dashboard with ESP32 firmware and cloud logging.',
     'Firmware, circuit diagram, dashboard code, project report and PPT.',
     'digital', 'eee', 'renewable-energy', 199900, 249900, 'intermediate',
     array['ESP32','MQTT','Node-RED'], array['smart grid','iot','energy'], null, false, false),
    ('g3-building-staad-analysis', 'Structural Analysis of a G+3 Building',
     'STAAD.Pro model, load calculations, design checks and complete project report.',
     'Model files, calculation sheets, drawings and a formatted project report.',
     'digital', 'civil', 'structural-design', 149900, null, 'beginner',
     array['STAAD.Pro','AutoCAD'], array['building','staad','design'], null, false, false),
    ('drone-flight-controller-design', 'Quadcopter Flight Controller Design Package',
     'PID tuning notes, simulation models, firmware source and design report for a quadcopter.',
     'MATLAB/Simulink models, firmware source, test logs and report.',
     'digital', 'aerospace', 'drones', 399900, 499900, 'advanced',
     array['MATLAB','Simulink','C++','STM32'], array['drone','pid','uav'], null, false, true),
    ('esp32-home-automation-kit', 'IoT Home Automation Kit (ESP32)',
     'ESP32 board, 4-channel relay, sensors and jumper set, with code and a wiring guide.',
     'Control appliances from a phone app. Kit contents: ESP32 DevKit, 4-ch relay, DHT11, PIR, jumper wires, USB cable.',
     'hardware', 'ece', 'iot', 219900, 259900, 'beginner',
     array['ESP32','Arduino IDE','MQTT'], array['home automation','iot','kit'], 450, true, true),
    ('line-follower-robot-kit', 'Line Follower Robot Kit',
     'Chassis, motors, IR sensor array and motor driver with tested Arduino code.',
     'Assemble and tune a PID line follower. Kit includes chassis, 2 geared motors, IR array, L298N driver, battery holder.',
     'hardware', 'robotics', 'line-follower', 189900, null, 'beginner',
     array['Arduino','L298N'], array['robot','line follower','kit'], 600, true, true),
    ('solar-tracker-mini-kit', 'Dual-Axis Solar Tracker Mini Kit',
     'Servo-based sun tracker with LDR sensors and a small solar panel.',
     'Demonstrates solar tracking. Kit includes 2 servos, 4 LDRs, Arduino Nano, mini panel and mounting frame.',
     'hardware', 'eee', 'renewable-energy', 279900, 329900, 'intermediate',
     array['Arduino','Servo'], array['solar','tracker','kit'], 700, true, false),
    ('robotic-arm-4dof-kit', 'Robotic Arm 4-DOF Kit',
     'Four-axis arm with servos, driver board and control software.',
     'Pick-and-place arm for demonstrations. Includes frame, 4 servos, PCA9685 driver, Arduino and code.',
     'hardware', 'robotics', 'robotic-arms', 649900, 749900, 'advanced',
     array['Arduino','PCA9685','Servo'], array['robotic arm','pick and place','kit'], 1200, true, false),
    ('arduino-weather-station-kit', 'Arduino Weather Station Kit',
     'Temperature, humidity and pressure logging with an LCD display and SD card.',
     'Kit includes Arduino Uno, BME280, 16x2 LCD, SD module and cables.',
     'hardware', 'ece', 'embedded-systems', 129900, null, 'beginner',
     array['Arduino','BME280'], array['weather','sensors','kit'], 350, true, false),
    ('ecg-sensor-kit', 'Biomedical ECG Sensor Kit',
     'Single-lead ECG acquisition board with electrodes and signal-processing code.',
     'Educational use only. Includes AD8232 board, electrodes, Arduino and example code.',
     'hardware', 'biomedical', 'biomedical-devices', 329900, null, 'intermediate',
     array['AD8232','Arduino'], array['ecg','biomedical','kit'], 300, false, false)
  ) as v(slug, title, summary, description, ptype, branch_slug, category_slug, price, mrp, difficulty,
         tech, tags, weight, cod, featured)
  join public.branches b on b.slug = v.branch_slug
  join public.categories c on c.branch_id = b.id and c.slug = v.category_slug
on conflict (slug) do nothing;

-- Stock for hardware only. ecg-sensor-kit is intentionally out of stock; weather-station is low stock.
insert into public.inventory (product_id, quantity_on_hand, low_stock_threshold)
select p.id, v.qty, 5
  from (values
    ('esp32-home-automation-kit', 40), ('line-follower-robot-kit', 25), ('solar-tracker-mini-kit', 12),
    ('robotic-arm-4dof-kit', 8), ('arduino-weather-station-kit', 3), ('ecg-sensor-kit', 0)
  ) as v(slug, qty)
  join public.products p on p.slug = v.slug
on conflict (product_id) do nothing;
