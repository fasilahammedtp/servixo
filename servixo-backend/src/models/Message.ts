import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  text: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ job: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, readAt: 1 });

export const Message = model<IMessage>("Message", messageSchema);
