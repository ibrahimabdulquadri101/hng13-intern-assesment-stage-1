import mongoose from "mongoose";

const propertiesSchema = new mongoose.Schema(
  {
    length: {
      type: Number,
      required: true,
      min: 0,
    },
    is_palindrome: {
      type: Boolean,
      required: true,
    },
    unique_characters: {
      type: Number,
      required: true,
      min: 0,
    },
    word_count: {
      type: Number,
      required: true,
      min: 0,
    },
    sha256_hash: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-f0-9]{64}$/i,
    },
    character_frequency_map: {
      type: Map,
      of: Number,
      required: true,
    },
  },
  { _id: false }
);

const StringAnalysisSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  properties: {
    type: propertiesSchema,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const StringAnalysis = mongoose.model("StringAnalysis", StringAnalysisSchema);

export default StringAnalysis;
