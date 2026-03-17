import type { GameState, WeatherType } from '../entities/types';
import { WEATHER_DEFS } from '../entities/constants';

const WEATHER_TYPES = Object.keys(WEATHER_DEFS) as WeatherType[];

export function updateWeather(state: GameState, dt: number): void {
  state.weather.timer -= dt;
  if (state.weather.timer > 0) return;

  const next = pickNextWeather(state.weather.type);
  const def = WEATHER_DEFS[next];
  state.weather.type = next;
  state.weather.timer = def.minDuration + Math.random() * (def.maxDuration - def.minDuration);
}

function pickNextWeather(current: WeatherType): WeatherType {
  const candidates = WEATHER_TYPES.filter(w => w !== current);
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
