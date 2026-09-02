import * as Sentry from "@sentry/nextjs";

export class SentryAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryAPIError";
  }
}

export class SentryFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryFrontendError";
  }
}

export const logErrorToSentry = (
  error: Error,
  context: Record<string, unknown> = {},
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const logMessageToSentry = (
  message: string,
  context: Record<string, unknown> = {},
) => {
  Sentry.captureMessage(message, {
    extra: context,
  });
};
