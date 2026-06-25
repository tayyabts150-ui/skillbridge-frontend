import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CareerChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CareerChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root',
})
export class CareerChatService {
  private readonly http = inject(HttpClient);

  send(role: string, messages: CareerChatMessage[]) {
    return this.http.post<CareerChatResponse>('/api/CareerChat', {
      role,
      messages,
    });
  }
}