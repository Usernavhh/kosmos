import { QUIZ_QUESTIONS, type QuizQuestion } from '../data/quizQuestions';

export interface GamesUICallbacks {
  onOpenGravitySandbox: () => void;
}

export class GamesUI {
  private el: HTMLDivElement;
  private open = false;
  private activeGame: 'menu' | 'quiz' = 'menu';

  // Quiz state
  private quizIndex = 0;
  private quizScore = 0;
  private quizAnswered = false;
  private quizQuestions: QuizQuestion[] = [];

  constructor(private cb: GamesUICallbacks) {
    this.el = document.createElement('div');
    this.el.className = 'games-overlay';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (e.code === 'Escape' && this.open) this.close();
      if (e.code === 'KeyQ' && !isInput && !e.ctrlKey && !e.metaKey && !e.repeat) {
        this.openMenu();
      }
    });
  }

  isOpen() { return this.open; }

  openMenu() {
    this.open = true;
    this.activeGame = 'menu';
    this.el.style.display = 'flex';
    this.render();
  }

  close() {
    this.open = false;
    this.el.style.display = 'none';
  }

  private render() {
    if (this.activeGame === 'menu') this.renderMenu();
    else if (this.activeGame === 'quiz') this.renderQuiz();
  }

  private renderMenu() {
    this.el.innerHTML = `
      <div class="games-panel">
        <h2>🎮 O'yinlar</h2>
        <div class="games-grid">
          <button class="game-card" data-game="gravity">
            <div class="game-icon">🌌</div>
            <div class="game-name">Gravitatsiya sandbox</div>
            <div class="game-desc">Jismlarni tashlab, tortishish kuchini sinab ko'r</div>
          </button>
          <button class="game-card" data-game="quiz">
            <div class="game-icon">🧠</div>
            <div class="game-name">Kosmik quiz</div>
            <div class="game-desc">Astronomiya savollari — bilimingni sinab ko'r</div>
          </button>
          <button class="game-card" data-game="scale">
            <div class="game-icon">📏</div>
            <div class="game-name">Bu qancha katta?</div>
            <div class="game-desc">Masshtabni topish o'yini</div>
          </button>
        </div>
        <button class="games-close">Yopish (ESC)</button>
      </div>
    `;

    this.el.querySelectorAll('.game-card').forEach((card) => {
      card.addEventListener('click', () => {
        const game = (card as HTMLElement).dataset.game;
        if (game === 'gravity') {
          this.close();
          this.cb.onOpenGravitySandbox();
        } else if (game === 'quiz') {
          this.startQuiz();
        } else if (game === 'scale') {
          alert('Tez orada...');
        }
      });
    });

    (this.el.querySelector('.games-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );
  }

  private startQuiz() {
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizAnswered = false;
    this.quizQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    this.activeGame = 'quiz';
    this.render();
  }

  private renderQuiz() {
    if (this.quizIndex >= this.quizQuestions.length) {
      this.renderQuizResult();
      return;
    }

    const q = this.quizQuestions[this.quizIndex];
    const progress = `${this.quizIndex + 1} / ${this.quizQuestions.length}`;

    this.el.innerHTML = `
      <div class="quiz-panel">
        <div class="quiz-header">
          <span class="quiz-progress">${progress}</span>
          <span class="quiz-score">Ball: ${this.quizScore}</span>
        </div>
        <div class="quiz-level">${q.level}</div>
        <h3 class="quiz-question">${q.q}</h3>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}">${String.fromCharCode(65 + i)}. ${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-explanation" style="display:none"></div>
        <button class="games-close">Yopish (ESC)</button>
      </div>
    `;

    this.el.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.quizAnswered) return;
        const idx = parseInt((btn as HTMLElement).dataset.index ?? '0');
        this.answerQuiz(idx);
      });
    });

    (this.el.querySelector('.games-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );
  }

  private answerQuiz(selected: number) {
    this.quizAnswered = true;
    const q = this.quizQuestions[this.quizIndex];
    const correct = selected === q.correct;

    if (correct) this.quizScore++;

    this.el.querySelectorAll('.quiz-option').forEach((btn) => {
      const idx = parseInt((btn as HTMLElement).dataset.index ?? '0');
      if (idx === q.correct) btn.classList.add('quiz-correct');
      else if (idx === selected) btn.classList.add('quiz-wrong');
      (btn as HTMLButtonElement).disabled = true;
    });

    const expl = this.el.querySelector('.quiz-explanation') as HTMLDivElement;
    expl.style.display = 'block';
    expl.innerHTML = `
      <div class="quiz-explain-${correct ? 'correct' : 'wrong'}">
        ${correct ? '✅ To\'g\'ri!' : '❌ Xato.'}
      </div>
      <div>${q.explanation}</div>
      <button class="quiz-next">Keyingisi →</button>
    `;

    (expl.querySelector('.quiz-next') as HTMLButtonElement).addEventListener(
      'click',
      () => {
        this.quizIndex++;
        this.quizAnswered = false;
        this.render();
      },
    );
  }

  private renderQuizResult() {
    const total = this.quizQuestions.length;
    const pct = Math.round((this.quizScore / total) * 100);
    const medal = pct >= 90 ? '🥇' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📚';

    this.el.innerHTML = `
      <div class="quiz-panel quiz-result">
        <div class="quiz-medal">${medal}</div>
        <h2>${this.quizScore} / ${total}</h2>
        <div class="quiz-percentage">${pct}%</div>
        <div class="quiz-message">
          ${
            pct >= 90
              ? 'Zo\'r! Sen haqiqiy astronom-san!'
              : pct >= 70
              ? 'Yaxshi natija! Yana o\'rganishing kerak.'
              : pct >= 50
              ? 'Yomon emas. Ko\'proq o\'qing.'
              : 'Boshlanish yaxshi. Astronomiyani o\'rganishni davom eting!'
          }
        </div>
        <button class="quiz-retry">Qaytadan</button>
        <button class="games-close">Yopish (ESC)</button>
      </div>
    `;

    (this.el.querySelector('.quiz-retry') as HTMLButtonElement).addEventListener(
      'click',
      () => this.startQuiz(),
    );
    (this.el.querySelector('.games-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.close(),
    );
  }
}