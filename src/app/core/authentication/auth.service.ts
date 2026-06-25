import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, iif, map, merge, of, share, switchMap, tap } from 'rxjs';
import { filterObject, isEmptyObject } from './helpers';
import { User } from './interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);

  private readonly userKey = 'skillbridge-user';

  private user$ = new BehaviorSubject<User>({});
  private change$ = merge(
    this.tokenService.change(),
    this.tokenService.refresh().pipe(switchMap(() => this.refresh()))
  ).pipe(
    switchMap(() => this.assignUser()),
    share()
  );

  init() {
    return new Promise<void>(resolve => this.change$.subscribe(() => resolve()));
  }

  change() {
    return this.change$;
  }

  check() {
    return this.tokenService.valid();
  }

  login(email: string, password: string, rememberMe = false) {
    return this.loginService.login(email, password, rememberMe).pipe(
      tap(res => {
        const { token, tokenType, expiresInMinutes, user, isOnboarded } = res.data;
        this.setUser(user, isOnboarded);
        this.tokenService.set({
          access_token: token,
          token_type: tokenType,
          expires_in: expiresInMinutes * 60,
        });
      }),
      map(() => this.check())
    );
  }

  register(params: any) {
    return this.loginService.register(params);
  }

  refresh() {
    return this.loginService
      .refresh(filterObject({ refresh_token: this.tokenService.getRefreshToken() }))
      .pipe(
        catchError(() => of(undefined)),
        tap(token => this.tokenService.set(token)),
        map(() => this.check())
      );
  }

  logout() {
    this.tokenService.clear();
    return of(!this.check());
    // return this.loginService.logout().pipe(
    //   tap(() => this.tokenService.clear()),
    //   map(() => !this.check())
    // );
  }

  user() {
    return this.user$.pipe(share());
  }

  setUser(data: User, isOnboarded?: boolean) {
    const user = { ...data, isOnboarded };
    this.user$.next(user);
    if (!isEmptyObject(user)) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  getUserSnapshot(): User {
    return this.user$.getValue();
  }

  menu() {
    return of([]); // Menu is now defined in the app, returning empty as placeholder
  }

  getEducationLevels() {
    return this.loginService.getEducationLevels();
  }

  private assignUser() {
    if (!this.check()) {
      this.setUser({}, false);
      return of({});
    }

    if (!isEmptyObject(this.user$.getValue())) {
      return of(this.user$.getValue());
    }
    

    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.setUser(user, user.isOnboarded);
        return of(user);
      } catch (e) {
        localStorage.removeItem(this.userKey);
      }
    }

    return this.loginService.getUser().pipe(
      map(res => {
        if (res.status === 'success') {
          this.setUser(res.data, res.data.isOnboarded);
          return res.data;
        }
        return {};
      }),
      catchError(() => {
        this.setUser({});
        return of({});
      })
    );
  }
}
