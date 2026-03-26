import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const NOTIF_TYPES = {
  report_new: { icon: '📋', color: '#f59e0b', label: 'New Report' },
  report_update: { icon: '✏️', color: '#3b82f6', label: 'Report Updated' },
  request_new: { icon: '📄', color: '#8b5cf6', label: 'New Request' },
  request_update: { icon: '✅', color: '#10b981', label: 'Request Updated' },
  system: { icon: '⚙️', color: '#6b7280', label: 'System' },
};

function NotificationDropdown({ userType, barangay = null }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_type', userType)
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter by barangay for officials
      if (userType === 'official' && barangay) {
        query = query.eq('barangay', barangay);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [userType, barangay]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_type=eq.${userType}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Check if notification is for this user's barangay (for officials)
            if (userType === 'official' && barangay && payload.new.barangay !== barangay) {
              return;
            }
            setNotifications(prev => [payload.new, ...prev].slice(0, 20));
            if (!payload.new.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new : n))
            );
            fetchNotifications(); // Refresh to update unread count
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType, barangay]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        className="off-notif"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            className="off-notif-badge"
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '999px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '380px',
            maxHeight: '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.target.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.target.style.background = 'none')}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const type = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: notif.is_read ? 'default' : 'pointer',
                      background: notif.is_read ? 'white' : '#f0f9ff',
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!notif.is_read) e.currentTarget.style.background = '#e0f2fe';
                    }}
                    onMouseLeave={(e) => {
                      if (!notif.is_read) e.currentTarget.style.background = '#f0f9ff';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: `${type.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}
                      >
                        {type.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: notif.is_read ? '500' : '600',
                            color: '#111827',
                            marginBottom: '4px',
                          }}
                        >
                          {notif.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            lineHeight: '1.4',
                            marginBottom: '6px',
                          }}
                        >
                          {notif.message}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: type.color,
                              background: `${type.color}15`,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {type.label}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                      {!notif.is_read && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#2563eb',
                            flexShrink: 0,
                            marginTop: '4px',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
              }}
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  fetchNotifications();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.target.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.target.style.background = 'none')}
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
