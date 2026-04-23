/**
 * Typed error classes for the Sentrul MCP server.
 */

export class GatewayError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(statusCode: number, responseBody: string, message: string) {
    super(message);
    this.name = "GatewayError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
