import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog Multiutente API',
      version: '1.0.0',
      description: 'Documentazione delle API per il progetto Blog Multiutente',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server di sviluppo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6656c7a6a481df0008469fd7' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'MarcoDev' },
            profileImage: { type: 'string', example: '/uploads/profile.png' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-05T15:56:40.195Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-05T15:56:40.195Z',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token mancante o non valido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Token non valido o scaduto' },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Risorsa non trovata',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Utente non trovato' },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Errore del server',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Errore interno del server' },
                },
              },
            },
          },
        },
        BadRequest: {
  description: 'Richiesta non valida (dati mancanti o errati)',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Email già registrata o dati non validi' },
        },
      },
    },
  },
        },
        Error: {
  description: 'Errore generico',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Si è verificato un errore' },
        },
      },
    },
  },
        }, 
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
