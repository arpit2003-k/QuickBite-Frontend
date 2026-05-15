import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.paymentUrl;

  processPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/process`, paymentData);
  }

  createRazorpayOrder(amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/razorpay/create-order`, null, {
      params: { amount: amount.toString() }
    });
  }

  verifyRazorpayPayment(orderId: string, paymentId: string, signature: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/razorpay/verify`, null, {
      params: { orderId, paymentId, signature }
    });
  }

  addToWallet(customerId: string, amount: number): Observable<any> {
    return this.http.post(`${environment.paymentUrl}/wallet/${customerId}/add`, { amount });
  }

  payFromWallet(customerId: string, orderId: string, amount: number): Observable<any> {
    return this.http.post(`${environment.paymentUrl}/wallet/${customerId}/pay`, { orderId, amount });
  }

  getWalletBalance(customerId: string): Observable<any> {
    return this.http.get<any>(`${environment.paymentUrl}/wallet/balance`, {
      params: { customerId }
    });
  }

  getWalletStatements(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.paymentUrl}/wallet/${customerId}/statements`);
  }
}
