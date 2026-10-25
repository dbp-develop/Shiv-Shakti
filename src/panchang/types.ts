/** A place on Earth plus its IANA time zone. */
export interface GeoLocation {
  lat: number;
  lng: number;
  tz: string;
  name?: string;
}

/** Default panchang location. */
export const UJJAIN: GeoLocation = { lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata', name: 'Ujjain' };

/** One element (tithi, nakshatra, yoga, karana…) and the instants it starts and ends. */
export interface Span {
  index: number;
  start: Date;
  end: Date;
}

/** A plain time window (rahu kaal, choghadiya slot…). */
export interface Period {
  start: Date;
  end: Date;
}
