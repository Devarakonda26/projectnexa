import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MORE_SAMPLE_PROJECTS } from "@/data/more-sample-projects";
import { SAMPLE_PROJECTS as BRIEF_30 } from "@/data/sample-projects";

const SAMPLE_PROJECTS = [...BRIEF_30, ...MORE_SAMPLE_PROJECTS];

const seed = readFileSync("supabase/seed.sql", "utf8");
const builder = readFileSync("scripts/build-samples.ts", "utf8");
const known = (slug: string) => seed.includes(`'${slug}'`) || builder.includes(`"${slug}"`);

const BRIEF_TITLES = [
  "AI-Based Student Performance Prediction", "Smart Campus Management System", "Network Intrusion Detection Using Machine Learning",
  "E-Commerce Product Recommendation System", "Intelligent Resume Screening System", "ESP32-Based Smart Home Automation",
  "IoT-Based Environmental Monitoring System", "FPGA-Based Digital Traffic Light Controller", "Digital Signal Processing for Audio Noise Reduction",
  "Smart Energy Meter Monitoring System", "Solar Panel Tracking System", "Battery Monitoring and Protection Demonstrator",
  "EV Charging Station Monitoring Dashboard", "Smart Street Lighting Controller", "Renewable Energy Generation Monitoring System",
  "Robotic Pick-and-Place Arm", "3D-Printed Mechanical Gearbox Design", "Predictive Maintenance Dashboard for Rotating Machinery",
  "Automated Material Sorting Prototype", "CFD-Based Thermal Analysis of a Heat Sink", "Structural Analysis of a Multi-Storey Building",
  "BIM-Based Building Design and Quantity Estimation", "Smart Water Tank Level Monitoring System", "Rainwater Harvesting Design and Analysis",
  "Road Traffic Density Analysis Dashboard", "Computer Vision-Based Object Detection", "Autonomous Line-Following Robot",
  "Smart Agriculture Monitoring System", "Drone Flight Data Visualization and Analysis", "Custom IoT Prototype Development Service",
];

describe("sample projects", () => {
  it("has exactly the 30 projects from the brief, in order", () => {
    expect(BRIEF_30.map((p) => p.title)).toEqual(BRIEF_TITLES);
    expect(BRIEF_30.map((p) => p.n)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("has the right product types", () => {
    const hardwareNumbers = [6, 7, 10, 11, 12, 14, 15, 16, 19, 23, 27, 28, 34, 36, 40, 43];
    for (const p of SAMPLE_PROJECTS) {
      const expected = p.n === 30 ? "custom" : hardwareNumbers.includes(p.n) ? "hardware" : "digital";
      expect(p.type, `#${p.n} ${p.title}`).toBe(expected);
    }
  });

  it("has unique slugs, project IDs and pictures", () => {
    expect(new Set(SAMPLE_PROJECTS.map((p) => p.slug)).size).toBe(SAMPLE_PROJECTS.length);
    expect(new Set(SAMPLE_PROJECTS.map((p) => p.sku)).size).toBe(SAMPLE_PROJECTS.length);
    for (const p of SAMPLE_PROJECTS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(p.sku).toMatch(/^[A-Z0-9][A-Z0-9-]{2,39}$/);
    }
  });

  it("fills every required field (and respects the database limits)", () => {
    for (const p of SAMPLE_PROJECTS) {
      const label = `#${p.n} ${p.title}`;
      expect(p.title.length, label).toBeGreaterThanOrEqual(3);
      expect(p.summary.length, label).toBeGreaterThanOrEqual(10);
      expect(p.summary.length, `${label} summary`).toBeLessThanOrEqual(300);
      expect(p.description.length, label).toBeGreaterThan(80);
      for (const [name, v] of Object.entries({ branch: p.branch, category: p.category, subdomain: p.subdomain, estimatedTime: p.estimatedTime, motif: p.motif })) {
        expect(v, `${label} ${name}`).toBeTruthy();
      }
      for (const [name, v] of Object.entries({ tech: p.tech, tags: p.tags, features: p.features, deliverables: p.deliverables, software: p.software, hardware: p.hardware, faq: p.faq })) {
        expect(v.length, `${label} ${name}`).toBeGreaterThan(0);
      }
      expect(p.features.length, label).toBeGreaterThanOrEqual(4);
      expect(p.faq.every((f) => f.q && f.a)).toBe(true);
      expect(p.estimatedTime.length).toBeLessThanOrEqual(60);
      expect(p.subdomain.length).toBeLessThanOrEqual(80);
      expect(p.faq.length).toBeLessThanOrEqual(12);
      expect(["beginner", "intermediate", "advanced"]).toContain(p.difficulty);
    }
  });

  it("uses sensible prices", () => {
    for (const p of SAMPLE_PROJECTS) {
      if (p.type === "custom") {
        expect(p.priceRupees).toBe(0);
        continue;
      }
      expect(p.priceRupees, p.title).toBeGreaterThanOrEqual(1000);
      expect(p.priceRupees, p.title).toBeLessThanOrEqual(7000);
      expect(Number.isInteger(p.priceRupees)).toBe(true);
      if (p.mrpRupees) expect(p.mrpRupees).toBeGreaterThan(p.priceRupees);
    }
  });

  it("only offers cash on delivery for hardware, and weight only for hardware", () => {
    for (const p of SAMPLE_PROJECTS) {
      if (p.cod) expect(p.type).toBe("hardware");
      if (p.type === "hardware") expect(p.weightGrams, p.title).toBeGreaterThan(0);
    }
  });

  it("points at branches and domains that exist", () => {
    for (const p of SAMPLE_PROJECTS) {
      expect(known(p.branch), `branch ${p.branch}`).toBe(true);
      expect(known(p.category), `category ${p.category}`).toBe(true);
    }
  });

  it("never claims the projects were built, tested or reviewed by customers", () => {
    const text = JSON.stringify(SAMPLE_PROJECTS).toLowerCase();
    for (const banned of [/tested and verified/, /customers love/, /5-star/, /\brated\b/, /best seller/, /bestseller/, /\bsold\b/]) {
      expect(text).not.toMatch(banned);
    }
  });

  it("has a picture file for every listing (and its technology card)", () => {
    for (const p of SAMPLE_PROJECTS) {
      expect(existsSync(`public/images/projects/${p.slug}.svg`), `${p.slug}.svg`).toBe(true);
      expect(existsSync(`public/images/projects/${p.slug}-tech.svg`), `${p.slug}-tech.svg`).toBe(true);
    }
    for (const f of ["hero.svg", "placeholder.svg"]) expect(existsSync(`public/images/${f}`)).toBe(true);
  });

  it("generates a seed file that matches the data", () => {
    const sql = readFileSync("supabase/seed_sample_projects.sql", "utf8");
    for (const p of SAMPLE_PROJECTS) expect(sql, p.slug).toContain(p.sku);
  });
});
