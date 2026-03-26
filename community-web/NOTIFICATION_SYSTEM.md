# Notification System Documentation

## Overview
The notification system provides real-time notifications for admins and officials about new reports, requests, and status updates.

## Features

### ✅ Implemented Features
1. **Real-time Notifications** - Uses Supabase real-time subscriptions
2. **Unread Badge Counter** - Shows number of unread notifications
3. **Mark as Read** - Click on notification to mark it as read
4. **Mark All as Read** - Button to mark all notifications as read
5. **Auto-refresh** - Notifications update automatically when new ones arrive
6. **Barangay Filtering** - Officials only see notifications for their barangay
7. **Notification Types**:
   - 📋 New Report
   - ✏️ Report Updated
   - 📄 New Request
   - ✅ Request Updated
   - ⚙️ System notifications

### 🎨 UI Components
- **NotificationDropdown.js** - Main notification component
- **AdminTopbar.js** - Updated with notification dropdown
- **OfficialTopbar.js** - Updated with notification dropdown

## Database Setup

### 1. Run the SQL Migration
Execute the `SETUP_NOTIFICATIONS.sql` file in your Supabase SQL editor:

```bash
# Copy the contents of SETUP_NOTIFICATIONS.sql and run it in Supabase
```

This will:
- Create the `notifications` table
- Set up indexes for performance
- Enable Row Level Security (RLS)
- Create policies for admins and officials
- Set up triggers for automatic notification creation

### 2. Table Structure

```sql
notifications (
    id UUID PRIMARY KEY,
    user_type TEXT ('admin' | 'official'),
    barangay TEXT,
    type TEXT ('report_new' | 'report_update' | 'request_new' | 'request_update' | 'system'),
    title TEXT,
    message TEXT,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ
)
```

## How It Works

### Automatic Notifications
Notifications are created automatically via database triggers:

1. **New Report Submitted** → Notifies officials (barangay) + admin
2. **Report Status Changed** → Notifies officials (barangay) + admin
3. **New Request Submitted** → Notifies officials (barangay) + admin
4. **Request Status Changed** → Notifies officials (barangay) + admin

### Real-time Updates
- Uses Supabase real-time subscriptions
- Notifications appear instantly without page refresh
- Unread count updates automatically

### Access Control
- **Admins**: See all notifications across all barangays
- **Officials**: Only see notifications for their assigned barangay

## Usage

### For Admins
```jsx
<NotificationDropdown userType="admin" />
```

### For Officials
```jsx
<NotificationDropdown userType="official" barangay={barangay} />
```

## Testing

### 1. Test New Report Notification
1. Submit a new report from the mobile app
2. Check admin and official dashboards
3. Notification should appear instantly

### 2. Test Status Update Notification
1. Update a report status from admin/official panel
2. Notification should appear for both admin and officials

### 3. Test Mark as Read
1. Click on an unread notification (blue background)
2. It should turn white and unread count should decrease

### 4. Test Mark All as Read
1. Click "Mark all read" button
2. All notifications should be marked as read
3. Badge counter should disappear

## Manual Notification Creation

You can also create custom notifications manually:

```sql
-- Notify all admins
INSERT INTO notifications (user_type, type, title, message)
VALUES ('admin', 'system', 'System Maintenance', 'System will be down for maintenance at 10 PM.');

-- Notify officials of a specific barangay
INSERT INTO notifications (user_type, barangay, type, title, message)
VALUES ('official', 'Barangay 1', 'system', 'Meeting Tomorrow', 'Monthly meeting scheduled for tomorrow at 2 PM.');
```

## Troubleshooting

### Notifications Not Appearing
1. Check if SQL migration was run successfully
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Ensure user is authenticated

### Real-time Not Working
1. Check Supabase real-time is enabled for the `notifications` table
2. Verify subscription is active in browser console
3. Check network tab for WebSocket connection

### Badge Count Wrong
1. Click "Refresh" button in notification dropdown
2. Check database for is_read values
3. Clear browser cache and reload

## Future Enhancements

Potential improvements:
- Sound notification on new notification
- Browser push notifications
- Email notifications
- Notification preferences/settings
- Notification history page
- Delete notifications
- Filter notifications by type
- Search notifications

## Security

- Row Level Security (RLS) enabled
- Admins can only see admin notifications
- Officials can only see their barangay notifications
- Authentication required for all operations

## Performance

- Indexed columns for fast queries
- Limited to 20 most recent notifications in dropdown
- Real-time subscription only for relevant notifications
- Efficient database triggers
