export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const successResponse = <T>(
  data: T,
  message?: string,
): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data,
});
