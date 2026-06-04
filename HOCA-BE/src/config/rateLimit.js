/**
 * Rate Limiting Configuration
 * Protects API from abuse and DDoS attacks
 */

// Global rate limit: 1000 requests per 15 minutes (increased for development)
const globalRateLimit = {
  max: 1000,
  timeWindow: "15 minutes",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    };
  },
};

// Strict rate limit for auth endpoints: 20 attempts per hour (increased for testing)
const authRateLimit = {
  max: 20,
  timeWindow: "1 hour",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many login attempts. Please try again in ${Math.ceil(context.ttl / 60000)} minutes.`,
    };
  },
};

// Medium rate limit for payment: 10 per 15 minutes
const paymentRateLimit = {
  max: 10,
  timeWindow: "15 minutes",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many payment requests. Please try again later.`,
    };
  },
};

// AI rate limit: 30 requests per hour (even for premium)
const aiRateLimit = {
  max: 30,
  timeWindow: "1 hour",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `AI rate limit exceeded. Try again in ${Math.ceil(context.ttl / 60000)} minutes.`,
    };
  },
};

module.exports = {
  globalRateLimit,
  authRateLimit,
  paymentRateLimit,
  aiRateLimit,
};
