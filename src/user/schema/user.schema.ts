import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Country {
  FRANCE = 'France',
  TUNISIA = 'Tunisia',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true, type: Date })
  hireDate: Date;

  @Prop({ required: true, enum: Country })
  country: Country;

  @Prop({ required: true, default: false })
  isAdmin: boolean;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true })
  password: string; // Required for local authentication

  @Prop({ required: true, default: true })
  firstLogin: boolean; // Track if user needs to change password

  @Prop({ required: false })
  emailResetToken?: string; // Token for email password reset
  @Prop({ required: false })
  emailResetTokenExpires?: Date; // Expiration date for reset token

  // Timestamps added by Mongoose (timestamps: true)
  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ emailResetToken: 1 }); // For password reset lookup

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});