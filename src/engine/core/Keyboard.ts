import type { TimeManager } from './TimeManager';

export function setupTimeKeyboard(time: TimeManager) {
  window.addEventListener('keydown', (e) => {
    // Vaqt tezligi tugmalari (raqamlar)
    if (e.code === 'Digit1') time.setSpeed(1); // real
    if (e.code === 'Digit2') time.setSpeed(60); // 1 daqiqa/sek
    if (e.code === 'Digit3') time.setSpeed(3600); // 1 soat/sek
    if (e.code === 'Digit4') time.setSpeed(86400); // 1 kun/sek
    if (e.code === 'Digit5') time.setSpeed(86400 * 30); // 1 oy/sek
    if (e.code === 'Digit6') time.setSpeed(86400 * 365); // 1 yil/sek

    // Pauza (Shift + Space)
    if (e.code === 'Space' && e.shiftKey) {
      e.preventDefault();
      time.togglePause();
    }

    // Hozirga qaytish
    if (e.code === 'KeyT') {
      time.reset();
      console.log('[time] Hozirga qaytdik');
    }
  });
}