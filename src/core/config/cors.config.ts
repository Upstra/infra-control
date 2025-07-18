import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const getHttpCorsOptions = (): CorsOptions => {
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL ?? 'http://localhost',
        'http://localhost',
        'http://localhost:80',
        'http://localhost:3000',
        'http://172.23.50.2',
        'http://172.23.50.2:80',
      ];

      if (process.env.NODE_ENV !== 'production') {
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (!origin || localhostRegex.test(origin)) {
          callback(null, true);
          return;
        }
        const devOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ];
        if (devOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  };
};

export const getWebSocketCorsOptions = () => {
  return {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL ?? 'http://localhost']
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
    credentials: true,
  };
};