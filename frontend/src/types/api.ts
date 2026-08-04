export interface ApiResponse<T> {
  data: T
}

export interface ApiErrorBody {
  error: string
}
