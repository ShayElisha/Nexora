import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        intent: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        entities: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    context: {
      currentTopic: {
        type: String,
        default: null,
      },
      mentionedEntities: [
        {
          type: String,
        },
      ],
      userPreferences: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ConversationSchema.index({ userId: 1, companyId: 1, updatedAt: -1 });

export default mongoose.model("Conversation", ConversationSchema);

