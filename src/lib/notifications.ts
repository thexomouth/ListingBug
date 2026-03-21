import { supabase } from './supabase';

export interface NotificationData {
  userId: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

/**
 * Creates a notification in the Supabase notifications table
 * Call this after:
 * - Successful automation run
 * - Successful search that saves listings
 * - Integration connect/disconnect events
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
}: NotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Notification creation error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch notifications for the current user
 * Ordered by created_at DESC, limited to 20
 */
export async function fetchUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Notification fetch error:', err);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Mark as read error:', err);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Delete notification error:', err);
    return false;
  }
}
