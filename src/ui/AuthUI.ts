import type { AuthManager } from '../engine/auth/AuthManager';

export class AuthUI {
  private el: HTMLDivElement;
  private auth: AuthManager;
  private open = false;
  private mode: 'login' | 'signup' = 'login';

  constructor(auth: AuthManager) {
    this.auth = auth;
    this.el = document.createElement('div');
    this.el.className = 'auth-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    // Tugma — pastda o‘ng burchakda
    this.createFloatingButton();

    // Auth holatiga qarab tugmani yangilash
    this.auth.onChange((user, profile) => {
      this.updateFloatingButton(user, profile);
    });
  }

  private createFloatingButton() {
    const btn = document.createElement('button');
    btn.className = 'auth-float-btn';
    btn.id = 'auth-float-btn';
    btn.innerHTML = '👤';
    btn.title = 'Kirish';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      if (this.auth.isLoggedIn()) {
        this.toggleProfileMenu();
      } else {
        this.openLogin();
      }
    });
  }

  private openLogin() {
    this.mode = 'login';
    this.open = true;
    this.el.style.display = 'flex';
    this.render();
  }

  private updateFloatingButton(
    user: unknown,
    profile: { name?: string; avatar_url?: string } | null,
  ) {
    const btn = document.getElementById('auth-float-btn');
    if (!btn) return;
    if (user && profile?.name) {
      btn.innerHTML = profile.name.charAt(0).toUpperCase();
      btn.title = profile.name;
      btn.classList.add('logged-in');
    } else {
      btn.innerHTML = '👤';
      btn.title = 'Kirish';
      btn.classList.remove('logged-in');
    }
  }

  private toggleProfileMenu() {
    const existing = document.getElementById('auth-profile-menu');
    if (existing) {
      existing.remove();
      return;
    }

    const profile = this.auth.getProfile();
    const user = this.auth.getUser();

    const menu = document.createElement('div');
    menu.id = 'auth-profile-menu';
    menu.className = 'auth-profile-menu';
    menu.innerHTML = `
      <div class="auth-profile-header">
        <div class="auth-profile-avatar">${(profile?.name ?? 'U').charAt(0).toUpperCase()}</div>
        <div class="auth-profile-info">
          <div class="auth-profile-name">${profile?.name ?? 'Foydalanuvchi'}</div>
          <div class="auth-profile-email">${user?.email ?? ''}</div>
        </div>
      </div>
      <button class="auth-profile-logout">Chiqish</button>
    `;

    document.body.appendChild(menu);

    menu.querySelector('.auth-profile-logout')!.addEventListener('click', async () => {
      await this.auth.signOut();
      menu.remove();

      // Input'lardagi eski ma'lumotlarni tozalash
      const inputs = this.el.querySelectorAll('input');
      inputs.forEach((inp) => {
        (inp as HTMLInputElement).value = '';
      });

      console.log('[auth] Chiqildi');
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(mode: 'login' | 'signup' = 'login') {
    // Agar foydalanuvchi allaqachon kirgan bo'lsa — modalni ochmaymiz
    if (this.auth.isLoggedIn()) {
      this.toggleProfileMenu();
      return;
    }

    if (this.open && this.mode === mode) {
      this.close();
      return;
    }

    this.mode = mode;
    this.open = true;
    this.el.style.display = 'flex';
    this.render();
  }

  close() {
    this.open = false;
    this.el.style.display = 'none';
  }

  private render() {
    const isLogin = this.mode === 'login';

    this.el.innerHTML = `
      <div class="auth-content">
        <button class="auth-close">✕</button>
        <h2>${isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}</h2>
        <p class="auth-subtitle">KOSMOS — o'zbek koinot platformasi</p>

        <button class="auth-google">
          <span class="auth-google-icon">G</span>
          Google orqali ${isLogin ? 'kirish' : "ro'yxatdan o'tish"}
        </button>

        <div class="auth-divider">yoki</div>

        <form class="auth-form">
          ${
            !isLogin
              ? `<label>Ismingiz</label>
                 <input type="text" class="auth-input" name="name" placeholder="Jamshid" autocomplete="off" required>`
              : ''
          }
          <label>Email</label>
          <input type="email" class="auth-input" name="email" placeholder="email@misol.uz" autocomplete="off" required>
          <label>Parol</label>
          <input type="password" class="auth-input" name="password" placeholder="••••••••" autocomplete="new-password" minlength="6" required>

          <button type="submit" class="auth-submit">
            ${isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <div class="auth-error" style="display:none"></div>

        <div class="auth-switch">
          ${isLogin ? "Akkountingiz yo'qmi?" : 'Allaqachon akkauntingiz bormi?'}
          <button class="auth-switch-btn">${isLogin ? "Ro'yxatdan o'tish" : 'Kirish'}</button>
        </div>
      </div>
    `;

    (this.el.querySelector('.auth-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );

    (this.el.querySelector('.auth-google') as HTMLButtonElement).addEventListener(
      'click',
      async () => {
        try {
          await this.auth.signInWithGoogle();
        } catch (e) {
          this.showError(e instanceof Error ? e.message : String(e));
        }
      },
    );

    (this.el.querySelector('.auth-switch-btn') as HTMLButtonElement).addEventListener(
      'click',
      () => this.toggle(isLogin ? 'signup' : 'login'),
    );

    const form = this.el.querySelector('.auth-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const email = fd.get('email') as string;
      const password = fd.get('password') as string;
      const name = fd.get('name') as string | null;

      try {
        if (isLogin) {
          await this.auth.signInWithEmail(email, password);
          console.log('[auth] Kirildi');
        } else {
          await this.auth.signUpWithEmail(email, password, name ?? email);
          this.showSuccess(
            "Ro'yxatdan o'tdingiz! Emailingizni tasdiqlang (spam papkada ham ko'ring).",
          );
        }
        this.close();
      } catch (e) {
        this.showError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  private showError(msg: string) {
    const err = this.el.querySelector('.auth-error') as HTMLDivElement;
    if (err) {
      err.textContent = msg;
      err.style.display = 'block';
      err.className = 'auth-error';
    }
  }

  private showSuccess(msg: string) {
    const err = this.el.querySelector('.auth-error') as HTMLDivElement;
    if (err) {
      err.textContent = msg;
      err.style.display = 'block';
      err.className = 'auth-success';
    }
  }
}