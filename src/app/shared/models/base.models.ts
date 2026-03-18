export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginatedRequest {
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface EnumChoice {
  value: string;
  label: string;
}
