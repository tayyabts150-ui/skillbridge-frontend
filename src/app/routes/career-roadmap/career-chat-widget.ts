import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CareerChatMessage, CareerChatService } from './career-chat.service';

@Component({
  selector: 'app-career-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './career-chat-widget.html',
  styleUrl: './career-chat-widget.scss',
})
export class CareerChatWidget {
  private readonly chatApi = inject(CareerChatService);

  @Input() role = '';

  isOpen = signal(false);
  isBusy = signal(false);
  input = '';

  messages = signal<CareerChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! 👋 I can help with job guidelines, skills, certifications, and interview tips. What role are you curious about?',
    },
  ]);

  toggle() {
    this.isOpen.set(!this.isOpen());
  }

  close() {
    this.isOpen.set(false);
  }

  send(text?: string) {
    const message = (text || this.input).trim();
    if (!message || this.isBusy()) return;

    const current = [...this.messages(), { role: 'user' as const, content: message }];
    this.messages.set(current);
    this.input = '';
    this.isBusy.set(true);

    this.chatApi.send(this.role, current.filter(x => x.role !== 'assistant' || x.content !== this.messages()[0].content)).subscribe({
      next: res => {
        this.messages.set([...this.messages(), { role: 'assistant', content: res.reply }]);
        this.isBusy.set(false);
      },
      error: () => {
        this.messages.set([
          ...this.messages(),
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ]);
        this.isBusy.set(false);
      },
    });
  }

  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}