export const GET_NOTIFICATIONS_QUERY = `
  query GetNotifications($userId: ID, $filter: NotificationFilterInput, $limit: Int, $offset: Int) {
    notifications(userId: $userId, filter: $filter, limit: $limit, offset: $offset) {
      notifications {
        id
        userId
        channel
        eventType
        subject
        content
        status
        isRead
        createdAt
      }
      total
      unreadCount
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT_QUERY = `
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_AS_READ_MUTATION = `
  mutation MarkNotificationAsRead($notificationId: ID!, $isRead: Boolean) {
    markNotificationAsRead(notificationId: $notificationId, isRead: $isRead) {
      id
      isRead
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      updatedCount
      success
    }
  }
`;

export const SEND_NOTIFICATION_MUTATION = `
  mutation SendNotification($input: SendNotificationInput!) {
    sendNotification(input: $input)
  }
`;
