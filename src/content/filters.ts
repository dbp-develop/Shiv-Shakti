import type { FestivalDef } from './festivals';
import { pinCategory, type PeethaList, type PinCategory, type Temple } from './schema';

export interface Filters {
  categories: Set<PinCategory>;
  list?: PeethaList;
  region?: string;
  /** 1–12, matches FestivalDef.months */
  festivalMonth?: number;
}

export function applyFilters(ts: Temple[], f: Filters, festivals: FestivalDef[]): Temple[] {
  const monthsById = new Map(festivals.map((x) => [x.id, x.months]));
  return ts.filter((t) => {
    if (!f.categories.has(pinCategory(t))) return false;
    if (f.list && !t.lists.includes(f.list)) return false;
    if (f.region && t.location.region !== f.region) return false;
    if (f.festivalMonth !== undefined) {
      const m = f.festivalMonth;
      if (!t.festivals.some((x) => monthsById.get(x.festivalId)?.includes(m))) return false;
    }
    return true;
  });
}
