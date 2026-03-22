interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  business_status?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

interface TextSearchResponse {
  results: PlaceResult[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
  error_message?: string;
}

export class GooglePlacesClient {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async textSearch(query: string, pageToken?: string): Promise<TextSearchResponse> {
    const params = new URLSearchParams({
      query,
      key: this.apiKey,
    });
    if (pageToken) params.set('pagetoken', pageToken);

    const response = await fetch(`${this.baseUrl}/textsearch/json?${params}`);
    if (!response.ok) throw new Error(`Google Places API error: ${response.status}`);
    return response.json() as Promise<TextSearchResponse>;
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,url,rating,user_ratings_total,types',
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/details/json?${params}`);
    if (!response.ok) return null;
    const data = await response.json() as PlaceDetailsResponse;
    if (data.status !== 'OK') return null;
    return data.result;
  }
}

export const SEARCH_QUERIES: Record<string, string[]> = {
  nutraceuticals: [
    'nutraceutical companies',
    'health supplement manufacturers',
    'dietary supplement companies',
    'ayurvedic medicine manufacturers',
  ],
  poultry_farm: [
    'poultry farms',
    'chicken farms',
    'poultry feed suppliers',
    'egg production farms',
  ],
  livestock: [
    'livestock farmers',
    'cattle farms',
    'dairy farms',
    'animal husbandry farms',
  ],
  fisheries: [
    'fisheries',
    'fish farms',
    'fish hatcheries',
    'marine fish farms',
  ],
  shrimp: [
    'shrimp farms',
    'prawn farms',
    'shrimp hatcheries',
    'aquaculture farms',
  ],
  aquaculture: [
    'aquaculture companies',
    'aqua feed manufacturers',
  ],
  animal_feed: [
    'animal feed manufacturers',
    'cattle feed companies',
    'poultry feed manufacturers',
  ],
  health_supplements: [
    'health food stores',
    'organic supplement companies',
    'spirulina retailers',
  ],
};
