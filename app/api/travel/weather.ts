// Server-only: real current weather via Open-Meteo (keyless). Geocodes the city,
// then reads current conditions. WMO weather codes are mapped to plain text.

export type CityWeather = {
  tempC: number;
  text: string;
  emoji: string;
  country: string | null;
  timezone: string | null;
};

const WMO: Record<number, { text: string; emoji: string }> = {
  0: { text: "Clear sky", emoji: "☀️" },
  1: { text: "Mainly clear", emoji: "🌤️" },
  2: { text: "Partly cloudy", emoji: "⛅" },
  3: { text: "Overcast", emoji: "☁️" },
  45: { text: "Foggy", emoji: "🌫️" },
  48: { text: "Rime fog", emoji: "🌫️" },
  51: { text: "Light drizzle", emoji: "🌦️" },
  53: { text: "Drizzle", emoji: "🌦️" },
  55: { text: "Heavy drizzle", emoji: "🌧️" },
  61: { text: "Light rain", emoji: "🌦️" },
  63: { text: "Rain", emoji: "🌧️" },
  65: { text: "Heavy rain", emoji: "🌧️" },
  71: { text: "Light snow", emoji: "🌨️" },
  73: { text: "Snow", emoji: "❄️" },
  75: { text: "Heavy snow", emoji: "❄️" },
  80: { text: "Rain showers", emoji: "🌦️" },
  81: { text: "Showers", emoji: "🌧️" },
  82: { text: "Violent showers", emoji: "⛈️" },
  95: { text: "Thunderstorm", emoji: "⛈️" },
  96: { text: "Thunderstorm w/ hail", emoji: "⛈️" },
  99: { text: "Severe thunderstorm", emoji: "⛈️" },
};

export async function fetchCityWeather(city: string): Promise<CityWeather | null> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl, { next: { revalidate: 86400 } });
  if (!geoRes.ok) return null;
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) return null;

  const fcUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`;
  const fcRes = await fetch(fcUrl, { next: { revalidate: 1800 } });
  if (!fcRes.ok) return null;
  const fc = await fcRes.json();
  const cur = fc?.current;
  if (!cur) return null;

  const code = WMO[cur.weather_code] ?? { text: "—", emoji: "🌡️" };
  return {
    tempC: Math.round(cur.temperature_2m),
    text: code.text,
    emoji: code.emoji,
    country: place.country ?? null,
    timezone: place.timezone ?? null,
  };
}
