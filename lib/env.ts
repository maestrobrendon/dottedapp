function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Database
  DATABASE_URL:               requireEnv("DATABASE_URL"),
  DIRECT_URL:                 requireEnv("DIRECT_URL"),

  // Auth
  NEXTAUTH_SECRET:            requireEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL:               requireEnv("NEXTAUTH_URL"),

  // Google OAuth + Calendar
  GOOGLE_CLIENT_ID:           requireEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET:       requireEnv("GOOGLE_CLIENT_SECRET"),

  // Encryption
  TOKEN_ENCRYPTION_KEY:       requireEnv("TOKEN_ENCRYPTION_KEY"),

  // Rate limiting
  UPSTASH_REDIS_REST_URL:     requireEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN:   requireEnv("UPSTASH_REDIS_REST_TOKEN"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME:      requireEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY:         requireEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET:      requireEnv("CLOUDINARY_API_SECRET"),
  CLOUDINARY_UPLOAD_PRESET:   requireEnv("CLOUDINARY_UPLOAD_PRESET"),
} as const;
