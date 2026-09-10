export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast?latitude=52.52,48.137&longitude=13.405,11.575&daily=temperature_2m_mean&forecast_days=16&timezone=Europe%2FBerlin&temperature_unit=celsius";

export function berlinDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export type WeatherSummary = {
  month: number;
  days: number;
  start: string;
  end: string;
  cities: { name: string; mean: number }[];
};

// Retain only the display summary in component memory, never the API response.
export function summarizeForecast(payload: unknown, today: string): WeatherSummary {
  if (!Array.isArray(payload) || payload.length !== 2) throw new Error("Missing cities");
  const month = Number(today.slice(5, 7));
  let dates: string[] = [];
  const cities = payload.map((city, index) => {
    const times: unknown = city?.daily?.time;
    const values: unknown = city?.daily?.temperature_2m_mean;
    if (city?.daily_units?.temperature_2m_mean !== "°C" || !Array.isArray(times) || !Array.isArray(values) || times.length !== 16 || values.length !== 16) throw new Error("Incomplete forecast");
    const selected: number[] = [];
    times.forEach((date, day) => {
      const expected = new Date(`${today}T12:00:00Z`);
      expected.setUTCDate(expected.getUTCDate() + day);
      if (date !== expected.toISOString().slice(0, 10)) throw new Error("Unexpected forecast date");
      const value = values[day];
      if (typeof value !== "number" || !Number.isFinite(value) || value < -60 || value > 60) throw new Error("Invalid temperature");
      if (date.slice(0, 7) === today.slice(0, 7)) selected.push(value);
    });
    dates = times as string[];
    return { name: index === 0 ? "Berlin" : "Munich", mean: selected.reduce((a, b) => a + b, 0) / selected.length };
  });
  return { month, days: dates.filter((date) => date.slice(0, 7) === today.slice(0, 7)).length, start: dates[0], end: dates[15], cities };
}
