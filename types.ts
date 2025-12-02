
export enum Tab {
  BAZI = 'bazi',
  STARS = 'stars',
  HOROSCOPE = 'horoscope',
  STORE = 'store',
  SETTINGS = 'settings'
}

export interface Pillar {
  gan: { char: string; element: string; tenGod: string };
  zhi: { char: string; element: string; hidden: { char: string; element: string; tenGod: string }[] };
  naYin: string;
  lifeStage: string;
  shenSha: string[];
  kongWang: boolean;
}

export interface LiuNian {
  index: number;
  year: number;
  age: number;
  ganZhi: string;
  gan: { char: string; element: string; tenGod: string };
  zhi: { char: string; element: string };
}

export interface DaYun {
  index: number;
  startAge: number;
  startYear: number;
  endYear: number;
  ganZhi: string;
  gan: { char: string; element: string; tenGod: string };
  zhi: { char: string; element: string };
  liuNian: LiuNian[];
}

export interface FiveElementsAnalysis {
  personality: string;
  health: string;
}

export interface BaZiChart {
  gender: string;
  calendarType: 'Solar' | 'Lunar';
  solarDate: string;
  lunarDateString: string;
  solarTime: string; // "Unknown" or HH:mm
  location: { province: string; city: string; district: string };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    time: Pillar | null; // Nullable if time unknown
  };
  dayMaster: { char: string; element: string; strength: string };
  daYun: DaYun[];
  strengthAnalysis: {
    score: number;
    level: string; // "Weak", "Strong", etc.
    details: string;
  };
  favorableElements: string[];
  fiveElementsAnalysis?: FiveElementsAnalysis;
}

export interface FlyingStarData {
  stars: Record<string, number>; // keys: 'center', 'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'
  advice: string;
  cures: string;
  wealthDirection: string;
}

export interface HoroscopeData {
  sign: string;
  dateRange: string;
  dailyForecast: string;
  luckyColor: string;
  luckyNumber: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

export enum ZodiacSign {
  Aries = "Aries",
  Taurus = "Taurus",
  Gemini = "Gemini",
  Cancer = "Cancer",
  Leo = "Leo",
  Virgo = "Virgo",
  Libra = "Libra",
  Scorpio = "Scorpio",
  Sagittarius = "Sagittarius",
  Capricorn = "Capricorn",
  Aquarius = "Aquarius",
  Pisces = "Pisces"
}
