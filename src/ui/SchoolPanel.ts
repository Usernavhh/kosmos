import { SCHOOL_PROBLEMS, type SchoolProblem, TOPICS } from '../data/schoolProblems';

export class SchoolPanel {
  private el: HTMLDivElement;
  private open = false;
  private currentTopic = 'all';
  private currentProblem: SchoolProblem | null = null;
  private showSolution = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'school-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (e.code === 'KeyM' && e.shiftKey && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === 'Escape' && this.open) this.close();
    });
  }

  isOpen() { return this.open; }

  toggle() {
    if (this.open) this.close();
    else this.open_();
  }

  private open_() {
    this.open = true;
    this.el.style.display = 'flex';
    this.render();
  }

  close() {
    this.open = false;
    this.showSolution = false;
    this.el.style.display = 'none';
  }

  private render() {
    const problems = this.currentTopic === 'all'
      ? SCHOOL_PROBLEMS
      : SCHOOL_PROBLEMS.filter((p) => p.topic === this.currentTopic);

    this.el.innerHTML = `
      <div class="school-content">
        <button class="school-close">✕</button>
        <h2>🎓 Maktab va Olimpiada</h2>
        <div class="school-subtitle">Astronomiya masalalari — o‘zbek tilida</div>

        <div class="school-topics">
          <button class="school-topic ${this.currentTopic === 'all' ? 'active' : ''}" data-topic="all">
            Hammasi (${SCHOOL_PROBLEMS.length})
          </button>
          ${TOPICS.map((t) => {
            const count = SCHOOL_PROBLEMS.filter((p) => p.topic === t).length;
            if (count === 0) return '';
            return `<button class="school-topic ${this.currentTopic === t ? 'active' : ''}" data-topic="${t}">
              ${t} (${count})
            </button>`;
          }).join('')}
        </div>

        <div class="school-problems">
          ${problems.map((p) => {
            const levelColor = p.level === 'ioaa' ? '#ff6644' : p.level === 'olimpiada' ? '#ffcc44' : '#88ffaa';
            return `
              <div class="school-problem" data-id="${p.id}">
                <div class="school-problem-header">
                  <span class="school-problem-level" style="color:${levelColor}">${p.level.toUpperCase()}</span>
                  <span class="school-problem-topic">${p.topic}</span>
                </div>
                <div class="school-problem-q">${p.question}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="school-hint">
          Shift + M — yopish · Masalani bosib javobni ko‘rish
        </div>
      </div>

      <div class="school-solution-overlay" style="display:none">
        <div class="school-solution-content">
          <button class="school-solution-close">✕</button>
          <div class="school-solution-topic"></div>
          <h3 class="school-solution-q"></h3>
          <div class="school-solution-answer"></div>
          <button class="school-solution-toggle">Yechimni ko‘rsatish</button>
          <div class="school-solution-steps" style="display:none"></div>
          <div class="school-solution-source"></div>
        </div>
      </div>
    `;

    (this.el.querySelector('.school-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );

    this.el.querySelectorAll('.school-topic').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentTopic = (btn as HTMLElement).dataset.topic ?? 'all';
        this.render();
      });
    });

    this.el.querySelectorAll('.school-problem').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id;
        const p = SCHOOL_PROBLEMS.find((x) => x.id === id);
        if (p) this.showProblem(p);
      });
    });
  }

  private showProblem(p: SchoolProblem) {
    this.currentProblem = p;
    this.showSolution = false;

    const overlay = this.el.querySelector('.school-solution-overlay') as HTMLDivElement;
    overlay.style.display = 'flex';

    (overlay.querySelector('.school-solution-topic') as HTMLDivElement).textContent = p.topic;
    (overlay.querySelector('.school-solution-q') as HTMLHeadingElement).textContent = p.question;
    (overlay.querySelector('.school-solution-answer') as HTMLDivElement).innerHTML =
      `<b>Javob:</b> ${p.answer}`;

    const steps = overlay.querySelector('.school-solution-steps') as HTMLDivElement;
    steps.innerHTML = `
      <div class="school-solution-steps-title">Yechim:</div>
      <ol>${p.solution.map((s) => `<li>${s}</li>`).join('')}</ol>
    `;
    steps.style.display = 'none';

    (overlay.querySelector('.school-solution-source') as HTMLDivElement).textContent =
      p.source ? `Manba: ${p.source}` : '';

    (overlay.querySelector('.school-solution-close') as HTMLButtonElement).addEventListener(
      'click',
      () => {
        overlay.style.display = 'none';
        this.showSolution = false;
      },
    );

    (overlay.querySelector('.school-solution-toggle') as HTMLButtonElement).addEventListener(
      'click',
      (e) => {
        this.showSolution = !this.showSolution;
        steps.style.display = this.showSolution ? 'block' : 'none';
        (e.target as HTMLButtonElement).textContent =
          this.showSolution ? 'Yechimni yashirish' : 'Yechimni ko‘rsatish';
      },
    );
  }
}