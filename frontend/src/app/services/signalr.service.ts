import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { OrderResponse } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;

  newOrder$ = new Subject<OrderResponse>();
  orderUpdated$ = new Subject<OrderResponse>();

  start() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/orders')
      .withAutomaticReconnect()
      .build();

    this.connection.on('NewOrder', (order: OrderResponse) =>
      this.newOrder$.next(order));

    this.connection.on('OrderUpdated', (order: OrderResponse) =>
      this.orderUpdated$.next(order));

    this.connection.start()
      .then(() => this.connection!.invoke('JoinKitchen'))
      .catch(err => console.error('SignalR error', err));
  }

  stop() {
    if (this.connection) {
      this.connection.invoke('LeaveKitchen');
      this.connection.stop();
    }
  }

  ngOnDestroy() {
    this.stop();
  }
}
