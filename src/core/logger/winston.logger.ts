import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const WinstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level.toUpperCase()} ${message}`;
        }),
      ),
    }),
  ],
});
