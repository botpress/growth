import {
  SESv2Client,
  CreateContactCommand,
  AlreadyExistsException,
} from "@aws-sdk/client-sesv2";
import * as bp from ".botpress";
import { getSesClient } from "./client";

const SESClient = getSesClient();

export const CONTACT_LIST = "default";

export async function addContactToList(email: string) {
  try {
    await SESClient.send(
      new CreateContactCommand({
        ContactListName: CONTACT_LIST,
        EmailAddress: email,
      }),
    );
    console.log(`Contact created: ${email}`);
  } catch (error) {
    if (error instanceof AlreadyExistsException) {
      console.log("Contact already exists, skipping creation...");
    } else {
      throw error;
    }
  }
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validates a single email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  //length check
  if (email.length > 320) {
    return false;
  }

  const [local, domain] = email.split("@") as [string, string];

  // Local part validation (before @)
  if (local.length === 0 || local.length > 64) {
    return false;
  }

  // Domain part validation (after @)
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  return EMAIL_REGEX.test(email);
}

/**
 * Validates an array of email addresses
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Validates email subject
 */
export function validateSubject(subject: string): {
  isValid: boolean;
  error?: string;
} {
  if (!subject || typeof subject !== "string") {
    return {
      isValid: false,
      error: "Subject is required and must be a string",
    };
  }

  if (subject.trim().length === 0) {
    return { isValid: false, error: "Subject cannot be empty" };
  }

  if (subject.length > 998) {
    // RFC 5322 line length limit
    return { isValid: false, error: "Subject too long (max 998 characters)" };
  }

  // Check for invalid characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(subject)) {
    return {
      isValid: false,
      error: "Subject contains invalid control characters",
    };
  }

  return { isValid: true };
}

/**
 * Validates email body content
 */
export function validateBody(body?: string): {
  isValid: boolean;
  error?: string;
} {
  if (body === undefined || body === null) {
    return { isValid: true }; // Body is optional
  }

  if (typeof body !== "string") {
    return { isValid: false, error: "Body must be a string" };
  }

  // AWS SES has a 40MB limit for message size
  const maxBodySize = 40 * 1024 * 1024; 
  const bodyBytes = Buffer.byteLength(body, "utf8");

  if (bodyBytes > maxBodySize) {
    return {
      isValid: false,
      error: `Body too large (${bodyBytes} bytes, max ${maxBodySize} bytes)`,
    };
  }

  return { isValid: true };
}

/**
 * validation for send email input
 */
export function validateSendEmailInput(input: {
  to: string[];
  subject: string;
  body?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate recipient emails
  if (!Array.isArray(input.to) || input.to.length === 0) {
    errors.push("At least one recipient email is required");
  } else {
    const { valid, invalid } = validateEmails(input.to);
    if (invalid.length > 0) {
      errors.push(`Invalid email addresses: ${invalid.join(", ")}`);
    }
    if (valid.length === 0) {
      errors.push("No valid email addresses provided");
    }
    // AWS SES limit: 50 recipients per message
    if (valid.length > 50) {
      errors.push("Too many recipients (max 50 per message)");
    }
  }

  // Validate subject
  const subjectValidation = validateSubject(input.subject);
  if (!subjectValidation.isValid) {
    errors.push(subjectValidation.error!);
  }

  // Validate body
  const bodyValidation = validateBody(input.body);
  if (!bodyValidation.isValid) {
    errors.push(bodyValidation.error!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
