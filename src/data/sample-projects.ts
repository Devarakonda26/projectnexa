/**
 * THE single source of truth for the 30 sample/demo listings.
 * - `npm run samples:build` turns this file into supabase/seed_sample_projects.sql and the SVG images in public/images/.
 * - tests/sample-projects.test.ts checks every record has every required field.
 * Every listing here is a SAMPLE: none of these projects has been built, tested or verified, and no files are for sale yet.
 * Replace them with your real catalogue from Admin -> Products. Prices are in rupees.
 */

export type SampleFaq = { q: string; a: string };

export type SampleProject = {
  /** 1..30, the position in the brief. */
  n: number;
  /** Project ID shown to customers, also the SKU. */
  sku: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  branch: string; // branches.slug
  category: string; // categories.slug (the "domain")
  subdomain: string;
  tech: string[];
  tags: string[];
  type: "digital" | "hardware" | "custom";
  priceRupees: number; // 0 for quote-only
  mrpRupees?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  features: string[];
  deliverables: string[];
  software: string[];
  hardware: string[];
  faq: SampleFaq[];
  featured?: boolean;
  weightGrams?: number;
  cod?: boolean;
  /** Which illustration to draw (see scripts/lib/art.ts). */
  motif: string;
  /** When set, this entry enriches an EXISTING product instead of inserting a new one (avoids a duplicate listing). */
  existingSlug?: string;
};

const NOTE_DIGITAL = "This is a sample listing, so there is no download yet. Real listings show exactly which files you receive.";
const NOTE_KIT = "This is a sample listing. Stock and delivery are confirmed by our team when the kit is published for real.";

export const SAMPLE_PROJECTS: SampleProject[] = [
  // ------------------------------------------------------------------ COMPUTER SCIENCE & IT
  {
    n: 1, sku: "PNX-DP-001", slug: "ai-student-performance-prediction",
    title: "AI-Based Student Performance Prediction",
    summary: "Machine-learning model that estimates a student's risk of low performance from attendance, internal marks and study habits.",
    description:
      "A complete machine-learning pipeline on tabular student data: cleaning, feature engineering, model training and a simple results dashboard. It compares several classifiers and explains which factors matter most.\n\nBuilt for learning: you can follow the notebook step by step, change the features, and present the evaluation metrics in your viva.",
    branch: "cse", category: "machine-learning", subdomain: "Educational data mining",
    tech: ["Python", "scikit-learn", "Pandas", "Matplotlib"], tags: ["prediction", "education", "classification", "final year"],
    type: "digital", priceRupees: 1999, mrpRupees: 2999, difficulty: "intermediate", estimatedTime: "3 to 4 weeks", featured: true, motif: "brain",
    features: ["Data cleaning and feature engineering on a student dataset", "Comparison of logistic regression, random forest and gradient boosting", "Confusion matrix, precision, recall and ROC curves", "Feature-importance chart to explain predictions", "Simple dashboard to try predictions on new records"],
    deliverables: ["Jupyter notebook and Python source code", "Sample dataset with a data dictionary", "Project report (Word and PDF)", "Presentation slides", "Viva question bank"],
    software: ["Python 3.10 or newer", "Jupyter Notebook or VS Code", "scikit-learn, Pandas, Matplotlib"], hardware: ["Any laptop with 4 GB RAM"],
    faq: [
      { q: "Do I need a GPU?", a: "No. The models are classical machine-learning models and train in seconds on a normal laptop." },
      { q: "Can I use my own college data?", a: "Yes. The data dictionary explains the columns, so you can replace the sample file with your own." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 2, sku: "PNX-DP-002", slug: "smart-campus-management-system",
    title: "Smart Campus Management System",
    summary: "Web application for timetables, notices, attendance and fee records, with separate student, faculty and admin roles.",
    description:
      "A full-stack campus portal with role-based access. Students see their timetable and notices, faculty mark attendance, and administrators manage courses and fee records.\n\nThe package explains the database design, REST API and React interface so you can extend it for your own college.",
    branch: "cse", category: "web-development", subdomain: "Campus ERP",
    tech: ["React", "Node.js", "Express", "PostgreSQL"], tags: ["campus", "erp", "full stack", "web app"],
    type: "digital", priceRupees: 3499, mrpRupees: 4499, difficulty: "advanced", estimatedTime: "5 to 6 weeks", motif: "dashboard",
    features: ["Role-based login for students, faculty and administrators", "Timetable, notices and attendance modules", "Fee records with printable receipts", "PostgreSQL schema with ER diagram", "REST API with documented endpoints"],
    deliverables: ["React front-end and Node.js back-end source code", "PostgreSQL schema and sample data script", "API documentation", "Project report with diagrams", "Deployment guide"],
    software: ["Node.js 18 or newer", "PostgreSQL 14 or newer", "VS Code and Git"], hardware: ["Laptop with 8 GB RAM recommended"],
    faq: [
      { q: "Which database does it use?", a: "PostgreSQL. A script creates the tables and loads sample data." },
      { q: "Can I host it online?", a: "The guide explains hosting on common platforms. Hosting costs are separate." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 3, sku: "PNX-DP-003", slug: "network-intrusion-detection-ml",
    existingSlug: "network-intrusion-detection-ml",
    title: "Network Intrusion Detection Using Machine Learning",
    summary: "Train and compare classifiers on network traffic data. Notebook, report and presentation included.",
    description:
      "Learn how machine learning can flag suspicious network traffic. The project walks through loading a public-style traffic dataset, preprocessing, training several classifiers and comparing their detection rates and false alarms.\n\nIt includes guidance on interpreting the results and on the limits of the approach.",
    branch: "cse", category: "cybersecurity", subdomain: "Network security",
    tech: ["Python", "scikit-learn", "Pandas", "network analysis"], tags: ["ids", "security", "ml"],
    type: "digital", priceRupees: 2999, difficulty: "intermediate", estimatedTime: "3 to 4 weeks", motif: "shield",
    features: ["Preprocessing of network flow records", "Training and comparison of several classifiers", "Detection rate and false-alarm analysis", "Confusion matrices and result charts", "Discussion of limitations and improvements"],
    deliverables: ["Notebook and Python source code", "Dataset notes and preprocessing steps", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "Jupyter Notebook", "scikit-learn, Pandas, Matplotlib"], hardware: ["Any laptop with 8 GB RAM"],
    faq: [
      { q: "Is real network capture needed?", a: "No. The project works on recorded traffic data." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 4, sku: "PNX-DP-004", slug: "ecommerce-product-recommendation-system",
    title: "E-Commerce Product Recommendation System",
    summary: "Recommends products using collaborative filtering and content-based methods, with an offline evaluation and a small demo app.",
    description:
      "Build the engine behind \"customers also liked\" suggestions. The project implements popularity, content-based and collaborative-filtering recommenders and compares them with standard ranking metrics.\n\nA small web demo shows recommendations for a chosen user or product.",
    branch: "cse", category: "machine-learning", subdomain: "Recommender systems",
    tech: ["Python", "Machine learning", "Recommendation algorithms", "Flask"], tags: ["recommendation", "e-commerce", "collaborative filtering"],
    type: "digital", priceRupees: 2499, mrpRupees: 3299, difficulty: "intermediate", estimatedTime: "3 to 5 weeks", motif: "cart",
    features: ["Popularity, content-based and collaborative-filtering recommenders", "Cosine similarity and matrix factorisation", "Offline evaluation with precision@k and recall@k", "Cold-start discussion", "Small Flask demo interface"],
    deliverables: ["Python source code and notebooks", "Sample ratings dataset", "Project report", "Presentation slides", "Viva question bank"],
    software: ["Python 3.10 or newer", "Pandas, NumPy, scikit-learn, Flask"], hardware: ["Any laptop with 8 GB RAM"],
    faq: [
      { q: "Does it use deep learning?", a: "The core methods are classical. The report suggests deep-learning extensions." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 5, sku: "PNX-DP-005", slug: "intelligent-resume-screening-system",
    title: "Intelligent Resume Screening System",
    summary: "Ranks resumes against a job description using text processing and machine learning, with skill extraction and a review screen.",
    description:
      "Parses resumes, extracts skills and experience, and scores each one against a job description. A simple review screen lists candidates in ranked order with the matching skills highlighted.\n\nThe report discusses fairness and why a human must make the final decision.",
    branch: "cse", category: "machine-learning", subdomain: "Natural language processing",
    tech: ["Python", "NLP", "Machine learning", "spaCy"], tags: ["resume", "nlp", "hiring", "text mining"],
    type: "digital", priceRupees: 2299, difficulty: "intermediate", estimatedTime: "3 to 4 weeks", motif: "document",
    features: ["Text extraction from PDF and DOCX resumes", "Skill and keyword extraction with NLP", "TF-IDF and embedding-based similarity scoring", "Ranked candidate list with matching skills", "Notes on bias and responsible use"],
    deliverables: ["Python source code", "Sample (fictional) resumes and job descriptions", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "spaCy, scikit-learn, Flask"], hardware: ["Any laptop with 8 GB RAM"],
    faq: [
      { q: "Are real people's resumes included?", a: "No. Only fictional sample resumes are used." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  // ------------------------------------------------------------------ ELECTRONICS & COMMUNICATION
  {
    n: 6, sku: "PNX-HK-006", slug: "esp32-smart-home-automation",
    title: "ESP32-Based Smart Home Automation",
    summary: "Control lights and appliances from your phone with an ESP32, relay module and sensors over Wi-Fi.",
    description:
      "A starter smart-home system built around the ESP32. A relay module switches mains-powered loads (with safety guidance), while sensors report temperature and motion to a simple phone-friendly dashboard.\n\nThe guide covers wiring, flashing the firmware and extending the system with more channels.",
    branch: "ece", category: "iot", subdomain: "Home automation",
    tech: ["ESP32", "Sensors", "Wi-Fi", "MQTT"], tags: ["smart home", "iot", "relay", "kit"],
    type: "hardware", priceRupees: 2799, mrpRupees: 3299, difficulty: "beginner", estimatedTime: "1 to 2 weeks", featured: true, weightGrams: 450, cod: true, motif: "chip",
    features: ["Wi-Fi control of up to four relay channels", "Temperature and motion sensing", "Phone-friendly web dashboard on the ESP32", "Optional MQTT integration", "Safety guidance for mains wiring"],
    deliverables: ["ESP32 development board", "4-channel relay module", "DHT11 and PIR sensors", "Jumper wires and USB cable", "Firmware source and wiring guide (PDF)"],
    software: ["Arduino IDE 2", "ESP32 board package"], hardware: ["USB power supply (5 V)", "A mains appliance only if you follow the safety guide"],
    faq: [
      { q: "Is it safe to connect mains appliances?", a: "Low-voltage testing comes first. The guide explains mains wiring safety, and you should ask a qualified person to help." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 7, sku: "PNX-HK-007", slug: "iot-environmental-monitoring-system",
    title: "IoT-Based Environmental Monitoring System",
    summary: "Measures temperature and humidity with an ESP32 and logs readings to a live online dashboard.",
    description:
      "Monitor room or lab conditions remotely. The ESP32 reads temperature and humidity at a set interval, shows values locally and sends them to a cloud dashboard where you can chart history.\n\nA good first IoT project that teaches sensors, networking and data visualisation together.",
    branch: "ece", category: "iot", subdomain: "Environmental sensing",
    tech: ["ESP32", "DHT22", "Wi-Fi", "MQTT"], tags: ["environment", "monitoring", "iot", "kit"],
    type: "hardware", priceRupees: 1899, difficulty: "beginner", estimatedTime: "1 to 2 weeks", weightGrams: 300, cod: true, motif: "sensorcloud",
    features: ["Temperature and humidity readings at a chosen interval", "Local OLED display of live values", "Cloud dashboard with history charts", "Threshold alerts", "Deep-sleep option to save power"],
    deliverables: ["ESP32 development board", "DHT22 sensor and OLED display", "Breadboard, jumper wires and USB cable", "Firmware source and wiring guide (PDF)"],
    software: ["Arduino IDE 2", "A free cloud dashboard account"], hardware: ["USB power supply (5 V)", "Wi-Fi network"],
    faq: [
      { q: "Do I need a paid cloud service?", a: "No. The guide uses a free tier. Terms of third-party services can change." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 8, sku: "PNX-DP-008", slug: "fpga-digital-traffic-light-controller",
    title: "FPGA-Based Digital Traffic Light Controller",
    summary: "Finite-state-machine traffic light controller in Verilog with pedestrian crossing, simulation and FPGA implementation notes.",
    description:
      "Design a four-way traffic light controller as a finite state machine in Verilog. The package includes the testbench, waveform explanations and notes for synthesising the design on an FPGA board.\n\nA clear, examiner-friendly project for learning digital design.",
    branch: "ece", category: "vlsi", subdomain: "Digital design",
    tech: ["Verilog", "FPGA", "Vivado", "ModelSim"], tags: ["fpga", "fsm", "traffic light", "vlsi"],
    type: "digital", priceRupees: 1799, difficulty: "intermediate", estimatedTime: "2 to 3 weeks", motif: "fpga",
    features: ["Four-way traffic controller as a finite state machine", "Pedestrian request handling", "Configurable timing with counters", "Testbench with waveform walkthrough", "Pin-assignment notes for common FPGA boards"],
    deliverables: ["Verilog source files and testbench", "State diagram and timing diagrams", "Project report", "Presentation slides"],
    software: ["Xilinx Vivado or Intel Quartus (free editions)", "ModelSim or the built-in simulator"], hardware: ["Optional: an FPGA development board"],
    faq: [
      { q: "Can I run it without an FPGA board?", a: "Yes, you can complete the simulation part on a laptop." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 9, sku: "PNX-DP-009", slug: "dsp-audio-noise-reduction",
    title: "Digital Signal Processing for Audio Noise Reduction",
    summary: "MATLAB project that removes noise from recorded audio using FIR, IIR and adaptive filters, with spectrum plots.",
    description:
      "Explore how filters clean up audio. You will design low-pass and band-pass filters, apply an adaptive LMS filter and compare results using spectrograms and signal-to-noise ratio.\n\nSuited to a DSP course project or mini project.",
    branch: "ece", category: "communication-systems", subdomain: "Digital signal processing",
    tech: ["MATLAB", "DSP", "Signal processing"], tags: ["dsp", "audio", "noise", "filters"],
    type: "digital", priceRupees: 1499, difficulty: "intermediate", estimatedTime: "2 weeks", motif: "wave",
    features: ["FIR and IIR filter design", "Adaptive LMS noise canceller", "Spectrogram and SNR comparison", "Recorded sample audio clips", "Step-by-step MATLAB scripts"],
    deliverables: ["MATLAB scripts", "Sample audio files", "Project report", "Presentation slides"],
    software: ["MATLAB with Signal Processing Toolbox (or a compatible alternative)"], hardware: ["Laptop with speakers or headphones"],
    faq: [
      { q: "Does it work in Octave?", a: "Most scripts are simple, but some toolbox functions may need small changes." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 10, sku: "PNX-HK-010", slug: "smart-energy-meter-monitoring-system",
    title: "Smart Energy Meter Monitoring System",
    summary: "Measures current and estimates power use of a connected load, then reports it to an online dashboard.",
    description:
      "A learning model of a smart energy meter. A current sensor and microcontroller measure load, calculate energy use and send it to a dashboard. The guide stresses safe, low-power experiments and does not turn this into a certified meter.",
    branch: "ece", category: "embedded-systems", subdomain: "Energy metering",
    tech: ["Microcontroller", "Current sensor", "IoT", "ESP32"], tags: ["energy meter", "iot", "current sensor", "kit"],
    type: "hardware", priceRupees: 2999, mrpRupees: 3599, difficulty: "intermediate", estimatedTime: "2 to 3 weeks", weightGrams: 400, cod: true, motif: "meter",
    features: ["Current sensing and energy estimation", "Live and cumulative usage display", "Cloud dashboard with daily usage chart", "Over-limit alert", "Calibration procedure explained"],
    deliverables: ["ESP32 development board", "Current sensor module", "LCD display and breadboard", "Jumper wires and USB cable", "Firmware source and wiring guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)", "Low-power load for testing"],
    faq: [
      { q: "Is it a certified energy meter?", a: "No. It is an educational model and must not be used for billing." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  // ------------------------------------------------------------------ ELECTRICAL ENGINEERING
  {
    n: 11, sku: "PNX-HK-011", slug: "solar-panel-tracking-system",
    title: "Solar Panel Tracking System",
    summary: "Arduino-controlled tracker that turns a small solar panel towards the brightest light using light sensors and servos.",
    description:
      "Learn why tracking improves collection. Light sensors compare brightness on each side of a small panel and servo motors tilt it towards the stronger light.\n\nThe kit compares fixed and tracking outputs so you can plot the difference yourself.",
    branch: "eee", category: "renewable-energy", subdomain: "Solar energy",
    tech: ["Arduino", "LDR light sensors", "Servo motors"], tags: ["solar", "tracker", "arduino", "kit"],
    type: "hardware", priceRupees: 2399, mrpRupees: 2899, difficulty: "intermediate", estimatedTime: "2 weeks", featured: true, weightGrams: 800, cod: true, motif: "solar",
    features: ["Dual-axis tracking logic with light sensors", "Servo control with smoothing", "Voltage readout from the panel", "Fixed versus tracking comparison method", "Adjustable sensitivity"],
    deliverables: ["Arduino Nano or Uno", "Small solar panel", "Four LDR sensors and two servos", "Mounting frame parts and wires", "Code and assembly guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)", "A sunny window or a lamp for testing"],
    faq: [
      { q: "Will it charge a phone?", a: "No. It uses a very small panel meant for demonstration." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 12, sku: "PNX-HK-012", slug: "battery-monitoring-protection-demonstrator",
    title: "Battery Monitoring and Protection Demonstrator",
    summary: "Monitors the voltage and temperature of a small battery pack and disconnects the load when limits are crossed.",
    description:
      "A low-voltage demonstrator of a battery management idea. A microcontroller reads voltage and temperature and drives a protection switch when a limit is exceeded.\n\nIt is built for safe classroom experiments with small low-voltage packs only.",
    branch: "eee", category: "power-electronics", subdomain: "Battery management",
    tech: ["Microcontroller", "Voltage sensor", "Temperature sensor", "Relay"], tags: ["battery", "bms", "protection", "kit"],
    type: "hardware", priceRupees: 2599, difficulty: "intermediate", estimatedTime: "2 weeks", weightGrams: 350, cod: true, motif: "battery",
    features: ["Voltage and temperature measurement", "Over-voltage, under-voltage and over-temperature cut-off", "Status LEDs and LCD readout", "Adjustable limits in firmware", "Safety checklist for low-voltage tests"],
    deliverables: ["Arduino-compatible board", "Voltage divider and temperature sensor", "Relay module, LCD and LEDs", "Wires and breadboard", "Code and wiring guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["Small low-voltage battery pack (not included)"],
    faq: [
      { q: "Is a battery included?", a: "No. Batteries are not included, and the guide only covers small low-voltage packs." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 13, sku: "PNX-DP-013", slug: "ev-charging-station-monitoring-dashboard",
    title: "EV Charging Station Monitoring Dashboard",
    summary: "Web dashboard that visualises charger status, energy delivered and session history from simulated station data.",
    description:
      "A monitoring dashboard concept for EV chargers. A simulator generates station and session data, and the dashboard shows availability, energy per session and daily trends.\n\nGood for learning dashboards, data pipelines and basic IoT messaging.",
    branch: "eee", category: "power-electronics", subdomain: "EV charging",
    tech: ["Python", "IoT dashboard", "Data visualization", "MQTT"], tags: ["ev", "charging", "dashboard", "visualisation"],
    type: "digital", priceRupees: 2799, difficulty: "intermediate", estimatedTime: "3 weeks", motif: "evcharge",
    features: ["Simulated charger data generator", "Live status board for chargers", "Energy and session charts", "Daily and weekly trend views", "Export of session records to CSV"],
    deliverables: ["Python source code", "Simulator and sample data", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "Plotly or Dash, Pandas, an MQTT broker (free)"], hardware: ["Any laptop with 8 GB RAM"],
    faq: [
      { q: "Does it connect to real chargers?", a: "No. It runs on simulated data for learning." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 14, sku: "PNX-HK-014", slug: "smart-street-lighting-controller",
    title: "Smart Street Lighting Controller",
    summary: "Switches LED street lights on at dusk and brightens them when motion is detected, to demonstrate energy saving.",
    description:
      "A model street light that senses ambient light and motion. LEDs stay dim when the road is empty and brighten when something moves, which demonstrates the idea behind adaptive lighting.\n\nA clear, visual demo for exhibitions and mini projects.",
    branch: "eee", category: "smart-lighting", subdomain: "Smart lighting",
    tech: ["Microcontroller", "LDR light sensor", "PIR motion sensor", "PWM"], tags: ["street light", "motion", "energy saving", "kit"],
    type: "hardware", priceRupees: 1599, difficulty: "beginner", estimatedTime: "1 week", weightGrams: 300, cod: true, motif: "streetlight",
    features: ["Dusk-to-dawn switching with a light sensor", "Motion-triggered brightness boost", "PWM dimming of LED lamps", "Adjustable thresholds", "Optional fault indication"],
    deliverables: ["Arduino-compatible board", "LDR and PIR sensors", "LED lamps and resistors", "Base board, wires and breadboard", "Code and assembly guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)"],
    faq: [
      { q: "Does it use mains power?", a: "No. It runs on low voltage and uses small LEDs." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 15, sku: "PNX-HK-015", slug: "renewable-energy-generation-monitoring-system",
    title: "Renewable Energy Generation Monitoring System",
    summary: "Logs voltage, current and power from a small solar source and plots generation over time.",
    description:
      "Measure and visualise what a small renewable source produces. Sensors record voltage and current, firmware calculates power and energy, and a dashboard plots generation across the day.\n\nIt uses a small panel for safe experiments.",
    branch: "eee", category: "renewable-energy", subdomain: "Energy monitoring",
    tech: ["Sensors", "Embedded systems", "Data visualization", "ESP32"], tags: ["renewable", "monitoring", "solar", "kit"],
    type: "hardware", priceRupees: 3199, mrpRupees: 3799, difficulty: "intermediate", estimatedTime: "2 to 3 weeks", weightGrams: 500, cod: true, motif: "windsolar",
    features: ["Voltage, current and power measurement", "Energy accumulation over time", "Local display and cloud charts", "Data logging to SD card", "Calibration steps documented"],
    deliverables: ["ESP32 development board", "Voltage and current sensor modules", "Small solar panel", "SD card module, wires and breadboard", "Firmware source and guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)", "Sunlight or a bright lamp"],
    faq: [
      { q: "Can it monitor a rooftop plant?", a: "No. It is designed for small low-voltage experiments only." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  // ------------------------------------------------------------------ MECHANICAL
  {
    n: 16, sku: "PNX-HK-016", slug: "robotic-pick-and-place-arm",
    title: "Robotic Pick-and-Place Arm",
    summary: "Desktop robotic arm with servo joints and a gripper that picks small objects and places them at set positions.",
    description:
      "A four-joint desktop arm driven by hobby servos. You assemble the frame, calibrate each joint and program pick-and-place sequences from a simple serial or button interface.\n\nThe CAD files let you study the design and modify the parts.",
    branch: "mechanical", category: "robotics-mechanisms", subdomain: "Robotic manipulators",
    tech: ["CAD", "Servo motors", "Microcontroller", "Arduino"], tags: ["robot arm", "pick and place", "servo", "kit"],
    type: "hardware", priceRupees: 5499, mrpRupees: 6499, difficulty: "advanced", estimatedTime: "3 to 4 weeks", featured: true, weightGrams: 1300, cod: true, motif: "arm",
    features: ["Four rotary joints plus a gripper", "Recorded and replayed pick-and-place sequences", "Joint calibration routine", "CAD models of all parts", "Smooth servo motion control"],
    deliverables: ["Arm frame parts", "Servo motors and servo driver board", "Arduino-compatible controller", "Power adapter and wiring", "CAD files, code and assembly guide (PDF)"],
    software: ["Arduino IDE 2", "A CAD viewer (free)"], hardware: ["Small screwdriver set", "Mains socket for the power adapter"],
    faq: [
      { q: "Can it lift heavy objects?", a: "No. It handles very light objects, such as small blocks." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 17, sku: "PNX-DP-017", slug: "3d-printed-mechanical-gearbox-design",
    title: "3D-Printed Mechanical Gearbox Design",
    summary: "Parametric design of a spur-gear reducer with gear calculations, CAD models and print-ready files.",
    description:
      "Design a compact two-stage gearbox from first principles. The project covers gear ratio and tooth calculations, CAD modelling and preparing parts for 3D printing.\n\nYou can print the parts yourself or at a local print shop.",
    branch: "mechanical", category: "3d-printing", subdomain: "Machine design",
    tech: ["CAD", "3D printing", "Gear design"], tags: ["gearbox", "cad", "3d print", "machine design"],
    type: "digital", priceRupees: 1999, difficulty: "intermediate", estimatedTime: "2 to 3 weeks", motif: "gear",
    features: ["Gear ratio, module and tooth-count calculations", "Parametric CAD model", "Exploded view and assembly drawings", "Print settings and tolerance notes", "Load and stress discussion"],
    deliverables: ["CAD model files", "STL files for printing", "Calculation sheet", "Project report", "Presentation slides"],
    software: ["Fusion 360 or FreeCAD", "A slicer such as Cura"], hardware: ["Optional: access to a 3D printer"],
    faq: [
      { q: "Do I need a 3D printer?", a: "Not to study the design. To make the parts, a printer or a print shop is needed." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 18, sku: "PNX-DP-018", slug: "predictive-maintenance-dashboard-rotating-machinery",
    title: "Predictive Maintenance Dashboard for Rotating Machinery",
    summary: "Analyses vibration data to flag early signs of bearing wear, shown on an interactive dashboard.",
    description:
      "Learn condition monitoring with public-style vibration datasets. The project extracts time and frequency features, trains a simple fault classifier and presents machine health on a dashboard.\n\nIt explains the limits of predictions made from small datasets.",
    branch: "mechanical", category: "condition-monitoring", subdomain: "Predictive maintenance",
    tech: ["Python", "Vibration analysis", "Machine learning", "Plotly"], tags: ["predictive maintenance", "vibration", "bearing", "dashboard"],
    type: "digital", priceRupees: 2899, mrpRupees: 3499, difficulty: "advanced", estimatedTime: "4 weeks", motif: "vibration",
    features: ["Time-domain and FFT feature extraction", "Healthy versus faulty classification", "Health indicator trend over time", "Interactive dashboard", "Discussion of data limits"],
    deliverables: ["Python source code and notebooks", "Sample vibration dataset notes", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "NumPy, SciPy, scikit-learn, Plotly"], hardware: ["Any laptop with 8 GB RAM"],
    faq: [
      { q: "Do I need a real machine?", a: "No. The project works on recorded vibration data." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 19, sku: "PNX-HK-019", slug: "automated-material-sorting-prototype",
    title: "Automated Material Sorting Prototype",
    summary: "Conveyor-style prototype that detects an object's colour or type and diverts it into the right bin.",
    description:
      "A small automation model of an industrial sorting line. Sensors detect each item, the controller decides its class and an actuator diverts it.\n\nA clear project to learn sensors, actuators and control sequencing together.",
    branch: "mechanical", category: "industrial-automation", subdomain: "Industrial automation",
    tech: ["Sensors", "Actuators", "Embedded control", "Arduino"], tags: ["sorting", "automation", "conveyor", "kit"],
    type: "hardware", priceRupees: 4499, mrpRupees: 5299, difficulty: "advanced", estimatedTime: "3 to 4 weeks", weightGrams: 1500, cod: true, motif: "sorter",
    features: ["Colour or presence detection", "Motorised belt with speed control", "Servo diverter for sorting", "Item counter on an LCD", "Adjustable timing in firmware"],
    deliverables: ["Controller board and sensors", "Belt motor and driver", "Servo diverter parts and frame", "Wires, power adapter and bins", "Code and assembly guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["Small screwdriver set", "Mains socket for the power adapter"],
    faq: [
      { q: "What can it sort?", a: "Small coloured blocks. It is a model, not an industrial machine." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 20, sku: "PNX-DP-020", slug: "cfd-thermal-analysis-heat-sink",
    title: "CFD-Based Thermal Analysis of a Heat Sink",
    summary: "Simulation study comparing heat-sink fin designs for cooling an electronic component.",
    description:
      "Model a heat sink in CAD, set up a thermal CFD simulation and compare fin spacing and height. The project explains meshing, boundary conditions and how to read temperature results.\n\nSuitable for a thermal engineering mini project.",
    branch: "mechanical", category: "thermal-engineering", subdomain: "Heat transfer",
    tech: ["Computational fluid dynamics", "CAD", "ANSYS or OpenFOAM"], tags: ["cfd", "heat sink", "thermal", "simulation"],
    type: "digital", priceRupees: 3299, difficulty: "advanced", estimatedTime: "3 to 4 weeks", motif: "heatsink",
    features: ["Parametric heat-sink CAD model", "Mesh and boundary-condition setup", "Comparison of three fin designs", "Temperature and velocity plots", "Grid-independence check explained"],
    deliverables: ["CAD files", "Simulation setup notes", "Result tables and plots", "Project report", "Presentation slides"],
    software: ["ANSYS Fluent student edition or OpenFOAM", "A CAD package"], hardware: ["Laptop with 16 GB RAM recommended"],
    faq: [
      { q: "Which software is needed?", a: "A CFD tool such as the ANSYS student edition or the free OpenFOAM. Setup notes cover both." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  // ------------------------------------------------------------------ CIVIL
  {
    n: 21, sku: "PNX-DP-021", slug: "structural-analysis-multi-storey-building",
    title: "Structural Analysis of a Multi-Storey Building",
    summary: "Load calculations, frame analysis and member design checks for a multi-storey reinforced concrete building.",
    description:
      "Walk through the analysis of a multi-storey frame: loads as per Indian standards, a computer model, results for beams and columns, and design checks.\n\nThe report explains each assumption so you can adapt the project to your own plan.",
    branch: "civil", category: "structural-design", subdomain: "Frame analysis",
    tech: ["Structural analysis", "Engineering simulation", "STAAD.Pro", "AutoCAD"], tags: ["structural", "building", "rcc", "design"],
    type: "digital", priceRupees: 2499, difficulty: "intermediate", estimatedTime: "4 weeks", motif: "building",
    features: ["Dead, live, wind and seismic load calculation", "Frame model and analysis workflow", "Bending moment and shear force results", "Beam and column design checks", "Bar-bending schedule overview"],
    deliverables: ["Model files and calculation sheets", "Plan and elevation drawings", "Project report", "Presentation slides"],
    software: ["STAAD.Pro or an equivalent analysis package", "AutoCAD or a DWG viewer"], hardware: ["Laptop with 8 GB RAM"],
    faq: [
      { q: "Which codes does it follow?", a: "Examples refer to commonly used Indian standards. Always check the latest editions for your work." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 22, sku: "PNX-DP-022", slug: "bim-building-design-quantity-estimation",
    title: "BIM-Based Building Design and Quantity Estimation",
    summary: "Model a small building in BIM software and extract material quantities and a cost estimate automatically.",
    description:
      "See why BIM is replacing manual take-off. You model a small building, tag elements and extract quantities of concrete, steel and finishes into a schedule that feeds a cost estimate.\n\nThe project compares BIM quantities with a manual calculation.",
    branch: "civil", category: "construction-technology", subdomain: "Building information modelling",
    tech: ["BIM", "3D modeling", "Quantity estimation", "Revit"], tags: ["bim", "revit", "estimation", "construction"],
    type: "digital", priceRupees: 2999, mrpRupees: 3799, difficulty: "intermediate", estimatedTime: "4 weeks", motif: "bim",
    features: ["Parametric 3D building model", "Automatic quantity schedules", "Comparison with manual take-off", "Rate analysis and cost estimate template", "Clash-check basics"],
    deliverables: ["BIM model files", "Quantity and cost spreadsheets", "Drawings exported from the model", "Project report", "Presentation slides"],
    software: ["Autodesk Revit (student licence) or an open BIM alternative", "Microsoft Excel"], hardware: ["Laptop with 16 GB RAM recommended"],
    faq: [
      { q: "Is Revit free?", a: "Students can often get a free educational licence. Check Autodesk's current terms." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 23, sku: "PNX-HK-023", slug: "smart-water-tank-level-monitoring-system",
    title: "Smart Water Tank Level Monitoring System",
    summary: "Measures water level with an ultrasonic sensor and alerts you, with optional automatic pump control.",
    description:
      "Avoid overflowing tanks. An ultrasonic sensor measures the water level, the controller shows it on a display and sends alerts, and a relay can switch a small pump on and off.\n\nThe guide covers safe pump switching and sensor placement.",
    branch: "civil", category: "environmental", subdomain: "Water management",
    tech: ["Sensors", "Microcontroller", "Alerts", "ESP32"], tags: ["water tank", "level", "ultrasonic", "kit"],
    type: "hardware", priceRupees: 1799, difficulty: "beginner", estimatedTime: "1 to 2 weeks", weightGrams: 350, cod: true, motif: "tank",
    features: ["Ultrasonic water-level measurement", "Percentage level on an LCD", "Low and full alerts over Wi-Fi", "Optional relay-driven pump control", "Calibration for different tank heights"],
    deliverables: ["ESP32 development board", "Waterproof ultrasonic sensor", "Relay module and LCD", "Wires and breadboard", "Code and wiring guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)", "A small tank or bucket for testing"],
    faq: [
      { q: "Can it switch a mains pump?", a: "It can drive a relay. Mains wiring should be done by a qualified person." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 24, sku: "PNX-DP-024", slug: "rainwater-harvesting-design-analysis",
    title: "Rainwater Harvesting Design and Analysis",
    summary: "Calculates roof catchment, storage size and recharge structures for a rainwater harvesting system.",
    description:
      "Design a rainwater harvesting system for a building. The project covers rainfall data analysis, catchment and runoff calculation, storage or recharge pit sizing and layout drawings.\n\nIt also estimates the water saved and a simple payback period.",
    branch: "civil", category: "environmental", subdomain: "Hydrology",
    tech: ["CAD", "Hydrology", "Engineering calculations", "Excel"], tags: ["rainwater", "harvesting", "hydrology", "design"],
    type: "digital", priceRupees: 1499, difficulty: "beginner", estimatedTime: "2 weeks", motif: "rain",
    features: ["Rainfall data and runoff calculation", "Storage tank and recharge pit sizing", "Layout drawing of the system", "Water saving and payback estimate", "Maintenance checklist"],
    deliverables: ["Calculation spreadsheet", "CAD layout drawings", "Project report", "Presentation slides"],
    software: ["Microsoft Excel or compatible", "AutoCAD or a free CAD viewer"], hardware: ["Any laptop"],
    faq: [
      { q: "Is local rainfall data included?", a: "The sheet is set up with example data. Replace it with data for your own location." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 25, sku: "PNX-DP-025", slug: "road-traffic-density-analysis-dashboard",
    title: "Road Traffic Density Analysis Dashboard",
    summary: "Counts vehicles from video with computer vision and shows traffic density by time of day on a dashboard.",
    description:
      "Use computer vision to understand traffic. The project detects and counts vehicles in recorded video, then summarises density by time and lane on an interactive dashboard.\n\nIt discusses the effect of lighting and camera angle on accuracy.",
    branch: "civil", category: "transportation", subdomain: "Traffic engineering",
    tech: ["Python", "Data visualization", "Computer vision", "OpenCV"], tags: ["traffic", "vehicle counting", "dashboard", "opencv"],
    type: "digital", priceRupees: 2699, difficulty: "intermediate", estimatedTime: "3 to 4 weeks", motif: "traffic",
    features: ["Vehicle detection and counting from video", "Density by time interval and lane", "Interactive charts", "Peak-hour summary", "Notes on camera placement"],
    deliverables: ["Python source code", "Sample video clip notes", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "OpenCV, Pandas, Plotly"], hardware: ["Laptop with 8 GB RAM"],
    faq: [
      { q: "Does it need a GPU?", a: "A GPU speeds up processing but is not required for short clips." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  // ------------------------------------------------------------------ AI, ROBOTICS, INTERDISCIPLINARY
  {
    n: 26, sku: "PNX-DP-026", slug: "computer-vision-object-detection",
    title: "Computer Vision-Based Object Detection",
    summary: "Detects and labels everyday objects in images and webcam video using a pretrained deep-learning model.",
    description:
      "Learn modern object detection by using a pretrained network. The project covers preparing images, running detection, drawing boxes and labels, and measuring accuracy on a small test set.\n\nIt also shows how to fine-tune the model on your own labelled images.",
    branch: "ai-data-science", category: "computer-vision", subdomain: "Object detection",
    tech: ["Python", "OpenCV", "Deep learning", "PyTorch"], tags: ["object detection", "yolo", "computer vision", "deep learning"],
    type: "digital", priceRupees: 2999, mrpRupees: 3999, difficulty: "intermediate", estimatedTime: "3 to 4 weeks", featured: true, motif: "eye",
    features: ["Pretrained detector on images and live webcam", "Bounding boxes with confidence scores", "Accuracy measurement on a small test set", "Fine-tuning on custom labelled images", "Notes on speed versus accuracy"],
    deliverables: ["Python source code and notebooks", "Sample images", "Project report", "Presentation slides", "Viva question bank"],
    software: ["Python 3.10 or newer", "OpenCV, PyTorch or TensorFlow"], hardware: ["Laptop with 8 GB RAM", "Optional: webcam and a GPU"],
    faq: [
      { q: "Is a GPU required?", a: "No for running the detector. Fine-tuning is faster with a GPU." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 27, sku: "PNX-HK-027", slug: "autonomous-line-following-robot",
    title: "Autonomous Line-Following Robot",
    summary: "Two-wheel robot that follows a black line using an IR sensor array and PID steering.",
    description:
      "Build the classic line follower. IR sensors read the line position, a PID controller steers two motors and the robot stays on track around curves.\n\nThe guide explains how to tune the PID values yourself.",
    branch: "robotics", category: "line-follower", subdomain: "Mobile robots",
    tech: ["Microcontroller", "IR sensors", "Motor driver", "PID control"], tags: ["line follower", "robot", "pid", "kit"],
    type: "hardware", priceRupees: 2199, mrpRupees: 2699, difficulty: "beginner", estimatedTime: "1 to 2 weeks", featured: true, weightGrams: 650, cod: true, motif: "robotcar",
    features: ["Five-sensor IR array", "PID steering with adjustable gains", "Calibration on any line colour contrast", "Speed control and start button", "Track design tips"],
    deliverables: ["Chassis, two geared motors and wheels", "IR sensor array", "Motor driver and Arduino-compatible board", "Battery holder, wires and screws", "Code and assembly guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["Batteries (not included)", "A line track made with black tape"],
    faq: [
      { q: "Are batteries included?", a: "No. The guide lists suitable batteries." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 28, sku: "PNX-HK-028", slug: "smart-agriculture-monitoring-system",
    title: "Smart Agriculture Monitoring System",
    summary: "Measures soil moisture and weather around a plant and switches a small pump automatically.",
    description:
      "A small smart-irrigation model. Soil-moisture and temperature sensors read the plant's surroundings, and a controller waters it only when the soil is dry.\n\nData goes to a dashboard so you can study watering patterns.",
    branch: "agricultural", category: "smart-farming", subdomain: "Precision irrigation",
    tech: ["IoT", "Soil moisture sensors", "Irrigation control", "ESP32"], tags: ["agriculture", "irrigation", "soil moisture", "kit"],
    type: "hardware", priceRupees: 2499, difficulty: "intermediate", estimatedTime: "2 weeks", featured: true, weightGrams: 500, cod: true, motif: "plant",
    features: ["Soil moisture and temperature sensing", "Automatic watering with adjustable threshold", "Dashboard with moisture history", "Low-water alert", "Power-saving sleep between readings"],
    deliverables: ["ESP32 development board", "Soil moisture sensor and DHT sensor", "Relay module and small water pump", "Tubing, wires and breadboard", "Firmware source and guide (PDF)"],
    software: ["Arduino IDE 2"], hardware: ["USB power supply (5 V)", "A potted plant and a water container"],
    faq: [
      { q: "Is it suitable for a real farm?", a: "No. It is a small educational model." },
      { q: "Is the kit in stock?", a: NOTE_KIT },
    ],
  },
  {
    n: 29, sku: "PNX-DP-029", slug: "drone-flight-data-visualization-analysis",
    title: "Drone Flight Data Visualization and Analysis",
    summary: "Reads drone flight logs and plots path, altitude, speed and battery use, with simple anomaly detection.",
    description:
      "Understand a flight from its data. The project parses telemetry logs, draws the flight path, plots altitude, speed and battery, and flags unusual jumps.\n\nIt uses log formats from common open flight controllers.",
    branch: "aerospace", category: "drones", subdomain: "Flight telemetry",
    tech: ["Python", "Flight telemetry", "Data visualization", "Pandas"], tags: ["drone", "telemetry", "flight log", "visualisation"],
    type: "digital", priceRupees: 2299, difficulty: "intermediate", estimatedTime: "3 weeks", motif: "drone",
    features: ["Telemetry log parser", "3D flight path and map plot", "Altitude, speed and battery charts", "Simple anomaly detection", "Exportable flight summary"],
    deliverables: ["Python source code", "Sample telemetry log notes", "Project report", "Presentation slides"],
    software: ["Python 3.10 or newer", "Pandas, Matplotlib, Plotly"], hardware: ["Any laptop"],
    faq: [
      { q: "Do I need a drone?", a: "No. Sample logs are used for the analysis." },
      { q: "Is this project verified?", a: NOTE_DIGITAL },
    ],
  },
  {
    n: 30, sku: "PNX-CU-030", slug: "custom-iot-prototype-development-service",
    title: "Custom IoT Prototype Development Service",
    summary: "Tell us your idea and we will scope, quote and build an IoT prototype around your requirements.",
    description:
      "Have an IoT idea that is not on the shelf? Describe it and we will review feasibility, agree a scope and give you a written quotation. Work then runs in milestones that you approve one by one.\n\nTechnologies are chosen according to your requirements. Nothing starts until you accept a quote.",
    branch: "ece", category: "iot", subdomain: "Custom product development",
    tech: ["Selected according to customer requirements"], tags: ["custom", "iot", "prototype", "service"],
    type: "custom", priceRupees: 0, difficulty: "advanced", estimatedTime: "Agreed in the quote", motif: "iotcustom",
    features: ["Free review of your requirements", "Written quotation before any work starts", "Milestone-based delivery with your approval at each step", "Progress visible in your account", "Documentation with the final prototype"],
    deliverables: ["Prototype as described in the accepted quote", "Source code and design files", "Short user guide", "Handover walkthrough"],
    software: ["Decided in the quote"], hardware: ["Decided in the quote"],
    faq: [
      { q: "How much does it cost?", a: "It depends on the scope. You receive a written quote and pay only if you accept it." },
      { q: "How long does it take?", a: "The timeline is part of the quote and is split into milestones." },
      { q: "Can I attach files to my request?", a: "Yes. You can attach sketches, documents or datasets to your request." },
    ],
  },
];
