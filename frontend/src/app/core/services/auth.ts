import { Injectable } from '@angular/core';
import { delay, of, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // In-memory mock database
  private users: any[] = [
    { username: 'demo', password: 'password', name: 'Demo User', email: 'demo@example.com', country: 'IN' }
  ];

  private currentUser: any = null;

  constructor() {}

  login(credentials: any): Observable<any> {
    const user = this.users.find(u => u.username === credentials.username && u.password === credentials.password);
    
    if (!user) {
      return throwError(() => new Error('Invalid username or password'));
    }

    this.currentUser = user; // Track logged in user

    return of({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        name: user.name,
        email: user.email,
        country: user.country
      }
    });
  }

  register(userData: any): Observable<any> {
    const newUser = {
      username: userData.username,
      password: userData.password,
      name: userData.fullName,
      email: userData.email,
      country: userData.country
    };
    
    this.users.push(newUser);

    return of({
      message: 'Registration successful',
      user: newUser
    });
  }

  getCurrencySymbol(): string {
    const country = this.currentUser ? this.currentUser.country : 'IN'; // Default to IN (Rupees)
    switch (country) {
      case 'US': return '$';
      case 'CA': return 'CA$';
      case 'UK': return '£';
      case 'AU': return 'AU$';
      case 'IN': return '₹';
      default: return '₹';
    }
  }
}
