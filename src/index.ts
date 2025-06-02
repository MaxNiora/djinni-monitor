// src/index.ts
console.log(">>> INDEX BOOTING …");

import "dotenv/config";
import "./bot/index";
import { scheduleScraping } from "./scraper/scheduler";

scheduleScraping();
