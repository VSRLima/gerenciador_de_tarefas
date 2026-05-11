export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
    description:
      'API for task and user management following a hexagonal architecture.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['login', 'password'],
                properties: {
                  login: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated successfully' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', 'finished', 'pending', 'scheduled'],
            },
          },
        ],
        responses: {
          '200': { description: 'Task list' },
        },
      },
      post: {
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    required: ['title', 'date', 'hour'],
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      date: { type: 'string', example: '2026-05-10' },
                      hour: { type: 'string', example: '14:30' },
                      isFinished: { type: 'boolean' },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      tasks: {
                        type: 'array',
                        maxItems: 5000,
                        example: [
                          {
                            title: 'Publish report',
                            description: 'Send summary to leadership',
                            date: '2026-05-10',
                            hour: '14:30',
                          },
                          {
                            title: 'Call supplier',
                            date: '2026-05-11',
                            hour: '09:00',
                          },
                        ],
                        items: {
                          type: 'object',
                          required: ['title', 'date', 'hour'],
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            date: { type: 'string' },
                            hour: { type: 'string' },
                            isFinished: { type: 'boolean' },
                          },
                        },
                      },
                    },
                    example: {
                      tasks: [
                        {
                          title: 'Publish report',
                          description: 'Send summary to leadership',
                          date: '2026-05-10',
                          hour: '14:30',
                        },
                        {
                          title: 'Call supplier',
                          date: '2026-05-11',
                          hour: '09:00',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Task created' },
          '202': { description: 'Bulk task creation queued' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Task found' },
        },
      },
      patch: {
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Task updated' },
        },
      },
      delete: {
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Task deleted' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        responses: {
          '200': { description: 'User list' },
        },
      },
      post: {
        tags: ['Users'],
        responses: {
          '201': { description: 'User created' },
        },
      },
    },
    '/users/{id}': {
      patch: {
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'User updated' },
        },
      },
      delete: {
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'User deleted' },
        },
      },
    },
  },
};
