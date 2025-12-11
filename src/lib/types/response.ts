// Generic API Response
export interface ApiResponse<T> {
  code: number;
  status: number;
  errors: null | string | string[]; // flexible for errors
  message: string;
  data: T;
}