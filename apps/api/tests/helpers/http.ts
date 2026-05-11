import { Response } from 'express';

export const createMockResponse = (): Response => {
  const response = {} as Response;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.send = jest.fn().mockReturnValue(response);
  response.setHeader = jest.fn().mockReturnValue(response);
  return response;
};
