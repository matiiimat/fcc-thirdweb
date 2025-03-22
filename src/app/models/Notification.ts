import mongoose, { Schema, Document } from 'mongoose';

// Interface for the notification document
export interface INotification extends Document {
  fromTeamId: string;
  toPlayerId: string;
  type: 'TEAM_INVITATION' | 'CONTRACT_REQUEST';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
  expiresAt: Date;
}

// Main notification schema
const NotificationSchema = new Schema<INotification>(
  {
    fromTeamId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    toPlayerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['TEAM_INVITATION', 'CONTRACT_REQUEST'],
      default: 'TEAM_INVITATION',
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
NotificationSchema.index({ createdAt: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ status: 1 });

// Create the model
const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;