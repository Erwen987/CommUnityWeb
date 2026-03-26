-- Create notifications table for admin and officials
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'official')),
    barangay TEXT,
    type TEXT NOT NULL CHECK (type IN ('report_new', 'report_update', 'request_new', 'request_update', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_barangay ON notifications(barangay);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to see all notifications
CREATE POLICY "Admins can view all admin notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    user_type = 'admin' 
    AND EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.auth_id = auth.uid()
    )
);

-- Policy for officials to see their barangay notifications
CREATE POLICY "Officials can view their barangay notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    user_type = 'official' 
    AND barangay IN (
        SELECT barangay FROM officials 
        WHERE officials.auth_id = auth.uid()
    )
);

-- Policy for admins to update their notifications
CREATE POLICY "Admins can update admin notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
    user_type = 'admin' 
    AND EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.auth_id = auth.uid()
    )
);

-- Policy for officials to update their notifications
CREATE POLICY "Officials can update their notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
    user_type = 'official' 
    AND barangay IN (
        SELECT barangay FROM officials 
        WHERE officials.auth_id = auth.uid()
    )
);

-- Function to create notification for new report
CREATE OR REPLACE FUNCTION notify_new_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify officials of the barangay
    INSERT INTO notifications (user_type, barangay, type, title, message, reference_id, reference_type)
    VALUES (
        'official',
        NEW.barangay,
        'report_new',
        'New Report Submitted',
        'A new report about "' || NEW.problem || '" has been submitted in your barangay.',
        NEW.id,
        'report'
    );
    
    -- Notify admin
    INSERT INTO notifications (user_type, type, title, message, reference_id, reference_type, barangay)
    VALUES (
        'admin',
        'report_new',
        'New Report Submitted',
        'A new report about "' || NEW.problem || '" has been submitted in ' || COALESCE(NEW.barangay, 'Unknown Barangay') || '.',
        NEW.id,
        'report',
        NEW.barangay
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for report status update
CREATE OR REPLACE FUNCTION notify_report_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify officials of the barangay
        INSERT INTO notifications (user_type, barangay, type, title, message, reference_id, reference_type)
        VALUES (
            'official',
            NEW.barangay,
            'report_update',
            'Report Status Updated',
            'Report "' || NEW.problem || '" status changed to ' || NEW.status || '.',
            NEW.id,
            'report'
        );
        
        -- Notify admin
        INSERT INTO notifications (user_type, type, title, message, reference_id, reference_type, barangay)
        VALUES (
            'admin',
            'report_update',
            'Report Status Updated',
            'Report "' || NEW.problem || '" in ' || COALESCE(NEW.barangay, 'Unknown Barangay') || ' status changed to ' || NEW.status || '.',
            NEW.id,
            'report',
            NEW.barangay
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for new request
CREATE OR REPLACE FUNCTION notify_new_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify officials of the barangay
    INSERT INTO notifications (user_type, barangay, type, title, message, reference_id, reference_type)
    VALUES (
        'official',
        NEW.barangay,
        'request_new',
        'New Document Request',
        'A new request for "' || NEW.document_type || '" has been submitted in your barangay.',
        NEW.id,
        'request'
    );
    
    -- Notify admin
    INSERT INTO notifications (user_type, type, title, message, reference_id, reference_type, barangay)
    VALUES (
        'admin',
        'request_new',
        'New Document Request',
        'A new request for "' || NEW.document_type || '" has been submitted in ' || COALESCE(NEW.barangay, 'Unknown Barangay') || '.',
        NEW.id,
        'request',
        NEW.barangay
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for request status update
CREATE OR REPLACE FUNCTION notify_request_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify officials of the barangay
        INSERT INTO notifications (user_type, barangay, type, title, message, reference_id, reference_type)
        VALUES (
            'official',
            NEW.barangay,
            'request_update',
            'Request Status Updated',
            'Request for "' || NEW.document_type || '" status changed to ' || NEW.status || '.',
            NEW.id,
            'request'
        );
        
        -- Notify admin
        INSERT INTO notifications (user_type, type, title, message, reference_id, reference_type, barangay)
        VALUES (
            'admin',
            'request_update',
            'Request Status Updated',
            'Request for "' || NEW.document_type || '" in ' || COALESCE(NEW.barangay, 'Unknown Barangay') || ' status changed to ' || NEW.status || '.',
            NEW.id,
            'request',
            NEW.barangay
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_new_report ON reports;
DROP TRIGGER IF EXISTS trigger_notify_report_update ON reports;
DROP TRIGGER IF EXISTS trigger_notify_new_request ON requests;
DROP TRIGGER IF EXISTS trigger_notify_request_update ON requests;

-- Create triggers for reports
CREATE TRIGGER trigger_notify_new_report
    AFTER INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_report();

CREATE TRIGGER trigger_notify_report_update
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_report_update();

-- Create triggers for requests
CREATE TRIGGER trigger_notify_new_request
    AFTER INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_request();

CREATE TRIGGER trigger_notify_request_update
    AFTER UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_request_update();

-- Verify setup
SELECT 'Notifications table created successfully!' as status;
SELECT COUNT(*) as notification_count FROM notifications;
