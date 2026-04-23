/**
 * Shared cryptography utilities for OAuth token encryption
 * Uses AES-256-GCM with unique IV per encryption
 */

const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a hex string of format: iv+ciphertext
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random 12-byte IV (recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import the encryption key
  const keyMaterial = hexToBytes(ENCRYPTION_KEY!);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV + ciphertext and return as hex
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bytesToHex(combined);
}

/**
 * Decrypt an encrypted token
 * @param encrypted Hex string of format: iv+ciphertext
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const combined = hexToBytes(encrypted);

  // Extract IV (first 12 bytes) and ciphertext (remainder)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Import the decryption key
  const keyMaterial = hexToBytes(ENCRYPTION_KEY!);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Get a valid access token from a connection, refreshing if necessary
 * @param connection Integration connection from database
 * @param supabase Supabase client (with service role key for updates)
 * @param refreshFn Function to refresh the token (provider-specific)
 * @returns Valid access token
 */
export async function getValidAccessToken(
  connection: any,
  supabase: any,
  refreshFn: (refreshToken: string) => Promise<{ access_token: string; refresh_token?: string; expires_in: number }>
): Promise<string> {
  const credentials = connection.credentials || {};

  // Decrypt tokens
  const accessToken = credentials.access_token_encrypted
    ? await decryptToken(credentials.access_token_encrypted)
    : credentials.access_token;  // Fallback for unencrypted (legacy)

  const refreshToken = credentials.refresh_token_encrypted
    ? await decryptToken(credentials.refresh_token_encrypted)
    : credentials.refresh_token;

  const expiresAt = credentials.expires_at || 0;

  // Check if token is still valid (with 5-minute buffer)
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;  // 5 minutes

  if (now < expiresAt - bufferMs) {
    return accessToken;
  }

  // Token expired or expiring soon - refresh it
  console.log(`[crypto] Token expired or expiring, refreshing for connection ${connection.id}`);

  if (!refreshToken) {
    throw new Error('REFRESH_TOKEN_MISSING');
  }

  try {
    const newTokens = await refreshFn(refreshToken);

    // Encrypt the new tokens
    const encryptedAccessToken = await encryptToken(newTokens.access_token);
    const newRefreshToken = newTokens.refresh_token || refreshToken;  // Some providers don't return new refresh token
    const encryptedRefreshToken = await encryptToken(newRefreshToken);

    const newExpiresAt = now + (newTokens.expires_in * 1000);

    // Update the database
    const updatedCredentials = {
      ...credentials,
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      expires_at: newExpiresAt,
      // Remove legacy unencrypted fields
      access_token: undefined,
      refresh_token: undefined,
    };

    const { error } = await supabase
      .from('integration_connections')
      .update({
        credentials: updatedCredentials,
        last_used_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', connection.id);

    if (error) {
      console.error('[crypto] Failed to update refreshed token:', error);
      throw new Error('TOKEN_UPDATE_FAILED');
    }

    return newTokens.access_token;
  } catch (err: any) {
    console.error('[crypto] Token refresh failed:', err.message);

    // Mark connection as expired
    await supabase
      .from('integration_connections')
      .update({ status: 'expired' })
      .eq('id', connection.id);

    throw new Error(`TOKEN_REFRESH_FAILED: ${err.message}`);
  }
}
