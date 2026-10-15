export class FooterInfo {
  private el: HTMLDivElement;
  private modal: HTMLDivElement | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'footer-info';
    this.el.textContent = 'Powered by Abduraxmon';
    document.body.appendChild(this.el);

    this.el.addEventListener('click', () => this.toggleModal());
  }

  private toggleModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      return;
    }

    this.modal = document.createElement('div');
    this.modal.className = 'footer-modal-overlay';
    this.modal.innerHTML = `
      <div class="footer-modal">
        <button class="footer-modal-close">✕</button>
        <div class="footer-modal-avatar">A</div>
        <h2 class="footer-modal-name">Mavlomov Abduraxmon</h2>
        <div class="footer-modal-age">20 yosh · O'zbekiston</div>
        <p class="footer-modal-bio">
          KOSMOS loyihasining asoschisi va yaratuvchisi.
          Brauzerda ishlaydigan haqiqiy koinotni noldan qurmoqda —
          3D dvigatel, real ma'lumotlar, AI gid va o'zbekcha ta'lim.
        </p>
        <div class="footer-modal-links">
          <a href="https://github.com/Usernavhh" target="_blank" rel="noopener">
            GitHub: @Usernavhh
          </a>
        </div>
        <div class="footer-modal-quote">
          "Koinotni o'zbek tilida kashf qilamiz"
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    (this.modal.querySelector('.footer-modal-close') as HTMLButtonElement).addEventListener(
      'click',
      () => {
        this.modal?.remove();
        this.modal = null;
      },
    );

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.modal?.remove();
        this.modal = null;
      }
    });
  }
}