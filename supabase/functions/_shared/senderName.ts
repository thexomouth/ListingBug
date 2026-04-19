/**
 * Sender Name Utilities (Deno version for Edge Functions)
 *
 * Generates custom sender display names for emails
 * Format: "FirstName @ BusinessName"
 * Example: "Mike @ Sandbox Realty"
 */

/**
 * Formats a sender name from contact name and business name
 * @param contactName - User's first/full name
 * @param businessName - User's business name
 * @returns Formatted sender name like "Mike @ Sandbox Realty"
 */
export function formatSenderName(
  contactName: string | null | undefined,
  businessName: string | null | undefined
): string {
  // Extract first name from contact name
  const firstName = contactName?.trim().split(' ')[0] || null;
  const business = businessName?.trim() || null;

  // Format based on what's available
  if (firstName && business) {
    return `${firstName} @ ${business}`;
  }

  if (business) {
    // No contact name, use business only
    return business;
  }

  if (firstName) {
    // No business, use first name only
    return firstName;
  }

  // Fallback
  return 'ListingBug';
}
