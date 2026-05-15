import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-send-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-broadcast.component.html',
  styleUrl: './send-broadcast.component.css'
})
export class SendBroadcastComponent {
  private notificationService = inject(NotificationService);

  title = '';
  message = '';
  sending = false;
  successMsg = '';
  errorMsg = '';

  sendBroadcast(): void {
    if (!this.title.trim() || !this.message.trim()) {
      this.errorMsg = 'Title and Message are both required.';
      return;
    }

    this.sending = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.notificationService.broadcast(this.title, this.message).subscribe({
      next: () => {
        this.sending = false;
        this.successMsg = 'Broadcast message sent successfully to all platform users!';
        this.title = '';
        this.message = '';
      },
      error: (err) => {
        this.sending = false;
        this.errorMsg = err?.error?.message || 'Failed to send broadcast message. Please try again.';
      }
    });
  }
}
