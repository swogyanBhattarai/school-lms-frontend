// lib/nepali-calendar.ts

//#region Date Helper Functions
function addDays(date: Date, days: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setUTCDate(newDate.getUTCDate() + days);
  return newDate;
}

function daysBetween(date1: Date, date2: Date): number {
  const utc1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
  const utc2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
  return Math.round((utc1 - utc2) / (24 * 60 * 60 * 1000));
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function isInRange(date: Date, range: { start: Date; end: Date }): boolean {
  const time = date.getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}
//#endregion

//#region BS Calendar Data (1975 BS - 2099 BS)
// Each array contains: [month1_days, month2_days, ..., month12_days, total_days]
const BS_YEARS: Record<number, number[]> = {};

BS_YEARS[1975] = [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30, 365];
BS_YEARS[1976] = [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31, 366];
BS_YEARS[1977] = [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31, 365];
BS_YEARS[1978] = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30, 365];
BS_YEARS[1979] = BS_YEARS[1975];
BS_YEARS[1980] = BS_YEARS[1976];
BS_YEARS[1981] = [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31, 365];
BS_YEARS[1982] = BS_YEARS[1978];
BS_YEARS[1983] = BS_YEARS[1975];
BS_YEARS[1984] = BS_YEARS[1976];
BS_YEARS[1985] = [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30, 365];
BS_YEARS[1986] = BS_YEARS[1978];
BS_YEARS[1987] = [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30, 365];
BS_YEARS[1988] = BS_YEARS[1976];
BS_YEARS[1989] = [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30, 365];
BS_YEARS[1990] = BS_YEARS[1978];
BS_YEARS[1991] = [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30, 365];
BS_YEARS[1992] = [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31, 366];
BS_YEARS[1993] = BS_YEARS[1989];
BS_YEARS[1994] = BS_YEARS[1978];
BS_YEARS[1995] = BS_YEARS[1991];
BS_YEARS[1996] = BS_YEARS[1992];
BS_YEARS[1997] = BS_YEARS[1978];
BS_YEARS[1998] = [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30, 365];
BS_YEARS[1999] = BS_YEARS[1976];
BS_YEARS[2000] = [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31, 365];
BS_YEARS[2001] = BS_YEARS[1978];
BS_YEARS[2002] = BS_YEARS[1975];
BS_YEARS[2003] = BS_YEARS[1976];
BS_YEARS[2004] = BS_YEARS[2000];
BS_YEARS[2005] = BS_YEARS[1978];
BS_YEARS[2006] = BS_YEARS[1975];
BS_YEARS[2007] = BS_YEARS[1976];
BS_YEARS[2008] = BS_YEARS[1981];
BS_YEARS[2009] = BS_YEARS[1978];
BS_YEARS[2010] = BS_YEARS[1975];
BS_YEARS[2011] = BS_YEARS[1976];
BS_YEARS[2012] = BS_YEARS[1985];
BS_YEARS[2013] = BS_YEARS[1978];
BS_YEARS[2014] = BS_YEARS[1975];
BS_YEARS[2015] = BS_YEARS[1976];
BS_YEARS[2016] = BS_YEARS[1985];
BS_YEARS[2017] = BS_YEARS[1978];
BS_YEARS[2018] = BS_YEARS[1987];
BS_YEARS[2019] = BS_YEARS[1992];
BS_YEARS[2020] = BS_YEARS[1989];
BS_YEARS[2021] = BS_YEARS[1978];
BS_YEARS[2022] = BS_YEARS[1991];
BS_YEARS[2023] = BS_YEARS[1992];
BS_YEARS[2024] = BS_YEARS[1989];
BS_YEARS[2025] = BS_YEARS[1978];
BS_YEARS[2026] = BS_YEARS[1976];
BS_YEARS[2027] = BS_YEARS[2000];
BS_YEARS[2028] = BS_YEARS[1978];
BS_YEARS[2029] = BS_YEARS[1998];
BS_YEARS[2030] = BS_YEARS[1976];
BS_YEARS[2031] = BS_YEARS[2000];
BS_YEARS[2032] = BS_YEARS[1978];
BS_YEARS[2033] = BS_YEARS[1975];
BS_YEARS[2034] = BS_YEARS[1976];
BS_YEARS[2035] = BS_YEARS[1977];
BS_YEARS[2036] = BS_YEARS[1978];
BS_YEARS[2037] = BS_YEARS[1975];
BS_YEARS[2038] = BS_YEARS[1976];
BS_YEARS[2039] = BS_YEARS[1985];
BS_YEARS[2040] = BS_YEARS[1978];
BS_YEARS[2041] = BS_YEARS[1975];
BS_YEARS[2042] = BS_YEARS[1976];
BS_YEARS[2043] = BS_YEARS[1985];
BS_YEARS[2044] = BS_YEARS[1978];
BS_YEARS[2045] = BS_YEARS[1987];
BS_YEARS[2046] = BS_YEARS[1976];
BS_YEARS[2047] = BS_YEARS[1989];
BS_YEARS[2048] = BS_YEARS[1978];
BS_YEARS[2049] = BS_YEARS[1991];
BS_YEARS[2050] = BS_YEARS[1992];
BS_YEARS[2051] = BS_YEARS[1989];
BS_YEARS[2052] = BS_YEARS[1978];
BS_YEARS[2053] = BS_YEARS[1991];
BS_YEARS[2054] = BS_YEARS[1992];
BS_YEARS[2055] = BS_YEARS[1978];
BS_YEARS[2056] = BS_YEARS[1998];
BS_YEARS[2057] = BS_YEARS[1976];
BS_YEARS[2058] = BS_YEARS[2000];
BS_YEARS[2059] = BS_YEARS[1978];
BS_YEARS[2060] = BS_YEARS[1975];
BS_YEARS[2061] = BS_YEARS[1976];
BS_YEARS[2062] = [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31, 365];
BS_YEARS[2063] = BS_YEARS[1978];
BS_YEARS[2064] = BS_YEARS[1975];
BS_YEARS[2065] = BS_YEARS[1976];
BS_YEARS[2066] = BS_YEARS[1981];
BS_YEARS[2067] = BS_YEARS[1978];
BS_YEARS[2068] = BS_YEARS[1975];
BS_YEARS[2069] = BS_YEARS[1976];
BS_YEARS[2070] = BS_YEARS[1985];
BS_YEARS[2071] = BS_YEARS[1978];
BS_YEARS[2072] = BS_YEARS[1987];
BS_YEARS[2073] = BS_YEARS[1976];
BS_YEARS[2074] = BS_YEARS[1989];
BS_YEARS[2075] = BS_YEARS[1978];
BS_YEARS[2076] = BS_YEARS[1991];
BS_YEARS[2077] = BS_YEARS[1992];
BS_YEARS[2078] = BS_YEARS[1989];
BS_YEARS[2079] = BS_YEARS[1978];
BS_YEARS[2080] = BS_YEARS[1991];
BS_YEARS[2081] = BS_YEARS[1992];
BS_YEARS[2082] = BS_YEARS[1978];
BS_YEARS[2083] = BS_YEARS[1978];
BS_YEARS[2084] = BS_YEARS[1976];
BS_YEARS[2085] = BS_YEARS[2000];
BS_YEARS[2086] = BS_YEARS[1978];
BS_YEARS[2087] = BS_YEARS[1975];
BS_YEARS[2088] = BS_YEARS[1976];
BS_YEARS[2089] = BS_YEARS[2000];
BS_YEARS[2090] = BS_YEARS[1978];
BS_YEARS[2091] = BS_YEARS[1975];
BS_YEARS[2092] = BS_YEARS[1976];
BS_YEARS[2093] = BS_YEARS[1981];
BS_YEARS[2094] = BS_YEARS[1978];
BS_YEARS[2095] = BS_YEARS[1975];
BS_YEARS[2096] = BS_YEARS[1976];
BS_YEARS[2097] = BS_YEARS[1985];
BS_YEARS[2098] = BS_YEARS[1978];
BS_YEARS[2099] = BS_YEARS[1975];
//#endregion

//#region Core Converter Class
class NepaliDateConverter {
  private epochStart = new Date(Date.UTC(1918, 3, 13)); // April 13, 1918
  private epochEnd = new Date(Date.UTC(2043, 3, 13));   // April 13, 2043
  
  private year: number;
  private month: number;
  private day: number;
  private dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  constructor(dateStr: string) {
    const [year, month, day] = this.parse(dateStr);
    this.year = year;
    this.month = month;
    this.day = day;
  }

  private parse(dateStr: string): [number, number, number] {
    const [year, month, day] = this.toEnglishDigits(dateStr)
      .replace(/[./|,]/g, "-")
      .trim()
      .split("-")
      .map(Number);
    return [year, month, day];
  }

  private toEnglishDigits(str: string): string {
    const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return str.replace(/[०१२३४५६७८९]/g, (match) => nepaliDigits.indexOf(match).toString());
  }

  private toDayName(dayIndex: number): string {
    return this.dayNames[dayIndex];
  }

  private toAdDate(year: number, month: number, day: number): Date {
    let totalDays = 0;
    
    // Add days for all years before the target year
    for (let y = 1975; y < year; y++) {
      totalDays += BS_YEARS[y][12]; // Index 12 is total days
    }
    
    // Add days for months in the current year
    for (let m = 0; m < month - 1; m++) {
      totalDays += BS_YEARS[year][m];
    }
    
    // Add remaining days
    totalDays += day - 1;
    
    return addDays(this.epochStart, totalDays);
  }

  private toBsDate(totalDays: number): { year: number; month: number; date: number } {
    let remainingDays = totalDays;
    
    for (const yearStr in BS_YEARS) {
      const year = Number(yearStr);
      const yearTotalDays = BS_YEARS[year][12];
      
      if (remainingDays >= yearTotalDays) {
        remainingDays -= yearTotalDays;
        continue;
      }
      
      for (let month = 0; month < 12; month++) {
        const monthDays = BS_YEARS[year][month];
        
        if (remainingDays >= monthDays) {
          remainingDays -= monthDays;
          continue;
        }
        
        return {
          year: year,
          month: month + 1,
          date: remainingDays + 1,
        };
      }
    }
    
    throw new Error("The input date is out of supported range.");
  }

  // Convert BS to AD
  toAd(): { year: number; month: number; date: number; day: string } {
    if (this.year < 1975 || this.year > 2099) {
      throw new Error("The input date is out of supported range.");
    }
    
    const adDate = this.toAdDate(this.year, this.month, this.day);
    
    return {
      year: adDate.getFullYear(),
      month: adDate.getMonth() + 1,
      date: adDate.getDate(),
      day: this.toDayName(adDate.getDay()),
    };
  }

  // Convert AD to BS
  toBs(): { year: number; month: number; date: number; day: string } {
    const adDate = new Date(Date.UTC(this.year, this.month - 1, this.day));
    
    if (!isInRange(adDate, { 
      start: startOfDay(this.epochStart), 
      end: endOfDay(this.epochEnd) 
    })) {
      throw new Error("The input date is out of supported range.");
    }
    
    const totalDays = daysBetween(adDate, this.epochStart);
    
    return {
      ...this.toBsDate(totalDays),
      day: this.toDayName(adDate.getUTCDay()),
    };
  }
}
//#endregion

//#region Public API

// Nepali month names in Devanagari
export const NEPALI_MONTHS = [
  "बैशाख", "जेठ", "आषाढ़", "श्रावण", "भाद्र", "आश्विन",
  "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र"
];

// Nepali month names in English
export const NEPALI_MONTHS_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

// Nepali week days in Devanagari (short)
export const NEPALI_WEEK_DAYS = [
  "आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"
];

// Nepali week days full names in Devanagari
export const NEPALI_WEEK_DAYS_FULL = [
  "आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"
];

// English week days (short)
export const ENGLISH_WEEK_DAYS = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];

// English week days (full)
export const ENGLISH_WEEK_DAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

// Nepali numbers in Devanagari
export const NEPALI_NUMBERS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

/**
 * Convert English number to Nepali (Devanagari)
 */
export function toNepaliNumber(num: number): string {
  return num.toString().split("").map(digit => NEPALI_NUMBERS[parseInt(digit)]).join("");
}

/**
 * Convert Nepali number to English
 */
export function toEnglishNumber(nepaliNum: string): number {
  const english = nepaliNum.split("").map(char => {
    const index = NEPALI_NUMBERS.indexOf(char);
    return index !== -1 ? index.toString() : char;
  }).join("");
  return parseInt(english);
}

/**
 * Convert BS date to AD Date object
 */

export function convertBSToAD(bsYear: number, bsMonth: number, bsDay: number): Date {
  try {
    const bsDateStr = `${bsYear}-${String(bsMonth + 1).padStart(2, "0")}-${String(bsDay).padStart(2, "0")}`;
    const converter = new NepaliDateConverter(bsDateStr);
    const adResult = converter.toAd();
    // Create date using UTC to avoid timezone issues
    return new Date(Date.UTC(adResult.year, adResult.month - 1, adResult.date));
  } catch (error) {
    console.error("BS to AD conversion error:", error);
    return new Date();
  }
}

/**
 * Convert AD Date object to BS date
 */
export function convertADToBS(adDate: Date): { year: number; month: number; day: number } {
  try {
    const adDateStr = `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, "0")}-${String(adDate.getDate()).padStart(2, "0")}`;
    const converter = new NepaliDateConverter(adDateStr);
    const bsResult = converter.toBs();
    return {
      year: bsResult.year,
      month: bsResult.month - 1, // Convert to 0-based month
      day: bsResult.date,
    };
  } catch (error) {
    console.error("AD to BS conversion error:", error);
    return { year: 2081, month: 0, day: 1 };
  }
}

/**
 * Format BS date string in Devanagari
 */
export function formatBSDate(year: number, month: number, day: number): string {
  return `${toNepaliNumber(year)} ${NEPALI_MONTHS[month]} ${toNepaliNumber(day)}`;
}

/**
 * Format BS date string in English
 */
export function formatBSDateEn(year: number, month: number, day: number): string {
  return `${NEPALI_MONTHS_EN[month]} ${day}, ${year}`;
}

/**
 * Format BS date as YYYY-MM-DD string
 */
export function formatBSDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Get today's BS date
 */
export function getTodayBS(): { year: number; month: number; day: number } {
  return convertADToBS(new Date());
}

/**
 * Get today's AD date as a YYYY-MM-DD string in local time.
 * Unlike toISOString().split('T')[0], this returns the correct local date
 * regardless of timezone offset.
 */
export function getTodayADString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get number of days in a BS month
 */
export function getBSMonthDays(year: number, month: number): number {
  // month is 0-based
  if (BS_YEARS[year]) {
    return BS_YEARS[year][month];
  }
  
  // Fallback: try to find the last valid day
  for (let day = 32; day >= 28; day--) {
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      new NepaliDateConverter(dateStr);
      return day;
    } catch (e) {
      continue;
    }
  }
  
  return 30; // Default fallback
}

/**
 * Get the starting day of week for a BS month (0 = Sunday)
 */
export function getBSMonthStartDay(year: number, month: number): number {
  const adDate = convertBSToAD(year, month, 1);
  return adDate.getDay();
}

/**
 * Get day name for a BS date
 */
export function getBSDayName(year: number, month: number, day: number, inNepali: boolean = false): string {
  const adDate = convertBSToAD(year, month, day);
  const dayIndex = adDate.getDay();
  return inNepali ? NEPALI_WEEK_DAYS_FULL[dayIndex] : ENGLISH_WEEK_DAYS_FULL[dayIndex];
}

/**
 * Parse a BS date string (supports multiple formats)
 */
export function parseBSDate(dateStr: string): { year: number; month: number; day: number } | null {
  try {
    const converter = new NepaliDateConverter(dateStr);
    const result = converter.toBs();
    return {
      year: result.year,
      month: result.month - 1,
      day: result.date,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate if a BS date is valid
 */
export function isValidBSDate(year: number, month: number, day: number): boolean {
  try {
    const dateStr = formatBSDateString(year, month, day);
    new NepaliDateConverter(dateStr);
    return true;
  } catch (error) {
    return false;
  }
}

//#endregion

//#region Types

export interface CalendarEvent {
  id: string;
  date: string; // Format: "YYYY-MM-DD" (BS)
  title: string;
  type: "holiday" | "event" | "exam" | "meeting" | "other";
  description?: string;
  color?: string;
  recurring?: "none" | "weekly" | "monthly" | "yearly";
  endDate?: string; // For multi-day events
}

export interface Holiday {
  id: string;
  date: string;
  title: string;
  description?: string;
  isPublic: boolean;
}

//#endregion