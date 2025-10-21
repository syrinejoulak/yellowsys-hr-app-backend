// src/app.module.ts
import { Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { APP_PIPE } from '@nestjs/core';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      // Connect to MongoDB with explicit connection options
      connectionFactory: (connection) => {
        console.log('🔗 MongoDB connection factory called');

        // ✅ Connected
        connection.on('connected', () => {
          console.log('✅ Connected to MongoDB successfully');
        });

        // ❌ Error
        connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
        });

        // 🔌 Disconnected
        connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
        });

        // 🔄 Reconnecting
        connection.on('reconnected', () => {
          console.log('🔄 MongoDB reconnected');
        });

        return connection;
      },
    }),
    UsersModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    // This method is called when the module has been initialized
    console.log('🚀 AppModule initialized, checking MongoDB connection...');

    // Add a small delay to ensure connection is established
    setTimeout(() => {
      const readyState = this.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      console.log(
        `📊 MongoDB connection state: ${states[readyState]} (${readyState})`,
      );

      if (readyState === 1) {
        console.log('✅ Connected to database - verified!');
      } else {
        console.log('⏳ MongoDB connection not yet established...');
      }
    }, 1000);
  }
}
