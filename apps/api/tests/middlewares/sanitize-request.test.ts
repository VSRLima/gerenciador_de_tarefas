import { NextFunction, Request } from 'express';
import { sanitizeRequest } from '../../src/adapters/http/middlewares/sanitize-request';

describe('sanitizeRequest middleware', () => {
  it('trims string fields recursively', () => {
    const req = {
      body: {
        title: '  Build feature   ',
        nested: {
          description: '  With spaces  ',
        },
      },
      query: {
        search: '  title  ',
      },
      params: {
        id: '  abc123  ',
      },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    sanitizeRequest(req, {} as never, next);

    expect(req.body).toEqual({
      title: 'Build feature',
      nested: {
        description: 'With spaces',
      },
    });
    expect(req.query.search).toBe('title');
    expect(req.params.id).toBe('abc123');
    expect(next).toHaveBeenCalled();
  });
});
