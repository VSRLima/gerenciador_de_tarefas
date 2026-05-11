import { ApiErrorResponse, ApiSuccessResponse } from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const extractSchemaErrorMessage = (details: unknown): string | null => {
  if (!details || typeof details !== 'object') {
    return null;
  }

  const schemaDetails = details as {
    formErrors?: unknown;
    fieldErrors?: Record<string, unknown>;
  };

  if (
    Array.isArray(schemaDetails.formErrors) &&
    typeof schemaDetails.formErrors[0] === 'string'
  ) {
    return schemaDetails.formErrors[0];
  }

  if (
    !schemaDetails.fieldErrors ||
    typeof schemaDetails.fieldErrors !== 'object'
  ) {
    return null;
  }

  for (const [field, messages] of Object.entries(schemaDetails.fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') {
      return `${field}: ${messages[0]}`;
    }
  }

  return null;
};

interface RequestOptions extends RequestInit {
  token?: string;
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });

  const body = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (!response.ok || !body.success) {
    const message =
      'error' in body
        ? body.error.code === 'SCHEMA_VALIDATION_ERROR'
          ? (extractSchemaErrorMessage(body.error.details) ??
            body.error.message)
          : body.error.message
        : 'Request failed';
    throw new ApiClientError(response.status, message);
  }

  return body.data;
};
