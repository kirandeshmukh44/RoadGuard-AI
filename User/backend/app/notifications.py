"""
Notification System for Pothole Detection
Supports email, SMS, and webhook notifications.
"""

import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import List, Optional
from datetime import datetime
from dataclasses import dataclass

@dataclass
class NotificationConfig:
    """Notification configuration"""
    # Email settings
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = ""
    email_to: List[str] = None
    
    # SMS settings (Twilio example)
    twilio_sid: str = ""
    twilio_token: str = ""
    twilio_from: str = ""
    sms_to: List[str] = None
    
    # Webhook settings
    webhook_url: str = ""
    webhook_secret: str = ""
    
    def __post_init__(self):
        if self.email_to is None:
            self.email_to = []
        if self.sms_to is None:
            self.sms_to = []


class NotificationManager:
    """Manage notifications for high-severity detections and system events"""
    
    def __init__(self, config: NotificationConfig = None):
        self.config = config or NotificationConfig()
    
    def send_email(self, subject: str, body: str, attachments: List[str] = None, to: List[str] = None) -> bool:
        """Send email notification"""
        if not all([self.config.smtp_host, self.config.smtp_user, self.config.smtp_password]):
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.config.email_from or self.config.smtp_user
            msg['To'] = ", ".join(to or self.config.email_to)
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            if attachments:
                for filepath in attachments:
                    if os.path.exists(filepath):
                        with open(filepath, 'rb') as f:
                            part = MIMEApplication(f.read(), Name=os.path.basename(filepath))
                        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(filepath)}"'
                        msg.attach(part)
            
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                server.starttls()
                server.login(self.config.smtp_user, self.config.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Email send failed: {e}")
            return False
    
    def send_sms(self, message: str, to: List[str] = None) -> bool:
        """Send SMS notification (requires Twilio)"""
        if not all([self.config.twilio_sid, self.config.twilio_token, self.config.twilio_from]):
            return False
        
        try:
            from twilio.rest import Client
            client = Client(self.config.twilio_sid, self.config.twilio_token)
            
            for number in (to or self.config.sms_to):
                client.messages.create(
                    body=message,
                    from_=self.config.twilio_from,
                    to=number
                )
            return True
        except Exception as e:
            print(f"SMS send failed: {e}")
            return False
    
    def send_webhook(self, payload: dict) -> bool:
        """Send webhook notification"""
        if not self.config.webhook_url:
            return False
        
        try:
            headers = {'Content-Type': 'application/json'}
            if self.config.webhook_secret:
                headers['X-Webhook-Secret'] = self.config.webhook_secret
            
            response = requests.post(
                self.config.webhook_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Webhook send failed: {e}")
            return False
    
    def notify_high_severity_detection(self, pothole_data: dict, report_path: str = None) -> dict:
        """Send notifications for high-severity pothole detection"""
        results = {"email": False, "sms": False, "webhook": False}
        
        subject = f"🚨 HIGH SEVERITY POTHOLE DETECTED - {pothole_data.get('road_name', 'Unknown Road')}"
        body = f"""
        <h2>High Severity Pothole Alert</h2>
        <p><strong>Location:</strong> {pothole_data.get('latitude')}, {pothole_data.get('longitude')}</p>
        <p><strong>Road:</strong> {pothole_data.get('road_name', 'Unknown')}</p>
        <p><strong>Severity:</strong> {pothole_data.get('severity', 'HIGH')}</p>
        <p><strong>Confidence:</strong> {pothole_data.get('confidence', 0):.2%}</p>
        <p><strong>Detected:</strong> {pothole_data.get('created_at', datetime.now().isoformat())}</p>
        <p><strong>Detection Method:</strong> {pothole_data.get('detection_method', 'AI')}</p>
        <p><a href="{pothole_data.get('image_url', '#')}">View Image</a></p>
        """
        
        attachments = [report_path] if report_path and os.path.exists(report_path) else None
        
        results["email"] = self.send_email(subject, body, attachments)
        results["sms"] = self.send_sms(f"HIGH SEVERITY POTHOLE: {pothole_data.get('road_name')} - Confidence: {pothole_data.get('confidence', 0):.0%}")
        results["webhook"] = self.send_webhook({
            "event": "high_severity_detection",
            "timestamp": datetime.now().isoformat(),
            "data": pothole_data
        })
        
        return results
    
    def notify_daily_summary(self, stats: dict) -> dict:
        """Send daily summary report"""
        results = {"email": False, "webhook": False}
        
        subject = f"📊 Daily Pothole Detection Summary - {datetime.now().strftime('%Y-%m-%d')}"
        body = f"""
        <h2>Daily Summary Report</h2>
        <p><strong>Total Detections:</strong> {stats.get('total_detections', 0)}</p>
        <p><strong>High Severity:</strong> {stats.get('high_severity', 0)}</p>
        <p><strong>Medium Severity:</strong> {stats.get('medium_severity', 0)}</p>
        <p><strong>Low Severity:</strong> {stats.get('low_severity', 0)}</p>
        <p><strong>New Reports:</strong> {stats.get('new_reports', 0)}</p>
        <p><strong>Repaired:</strong> {stats.get('repaired', 0)}</p>
        """
        
        results["email"] = self.send_email(subject, body)
        results["webhook"] = self.send_webhook({
            "event": "daily_summary",
            "timestamp": datetime.now().isoformat(),
            "data": stats
        })
        
        return results


# Default instance (configure via environment variables)
def get_notification_manager() -> NotificationManager:
    """Get notification manager with config from environment"""
    config = NotificationConfig(
        smtp_host=os.getenv("SMTP_HOST", ""),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER", ""),
        smtp_password=os.getenv("SMTP_PASSWORD", ""),
        email_from=os.getenv("EMAIL_FROM", ""),
        email_to=os.getenv("EMAIL_TO", "").split(",") if os.getenv("EMAIL_TO") else [],
        twilio_sid=os.getenv("TWILIO_SID", ""),
        twilio_token=os.getenv("TWILIO_TOKEN", ""),
        twilio_from=os.getenv("TWILIO_FROM", ""),
        sms_to=os.getenv("SMS_TO", "").split(",") if os.getenv("SMS_TO") else [],
        webhook_url=os.getenv("WEBHOOK_URL", ""),
        webhook_secret=os.getenv("WEBHOOK_SECRET", "")
    )
    return NotificationManager(config)