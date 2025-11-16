// ======= Hearing Test JS =======

// Elements
const startBtn = document.getElementById('startHearingTest');
const hearingInput = document.getElementById('hearingInput');
const hearingSpeedSlider = document.getElementById('hearingSpeed');
const hearingSpeedValue = document.getElementById('hearingSpeedValue');
const hearingTime = document.getElementById('hearingTime');
const hearingCorrectDisplay = document.getElementById('hearingCorrect');
const hearingAccuracyDisplay = document.getElementById('hearingAccuracy');
const hearingHistoryBody = document.getElementById('hearingHistoryBody');
const correctSeqDisplay = document.getElementById('correctSeqDisplay');
const userSeqDisplay = document.getElementById('userSeqDisplay');

// Morse maps
const morseToText = {
  ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G",
  "....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N",
  "---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U",
  "...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z",
  "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5",
  "-....":"6","--...":"7","---..":"8","----.":"9"
};
const textToMorse = {};
for (let k in morseToText) textToMorse[morseToText[k]] = k;

// State
let sequence = [];
let startTime = null;

// Utility
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Play Morse for one letter
async function playLetter(letter) {
  const unit = 1200 / parseInt(hearingSpeedSlider.value);
  const code = textToMorse[letter.toUpperCase()];
  if (!code) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  for (let i = 0; i < code.length; i++) {
    const symbol = code[i];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.connect(ctx.destination);
    const dur = symbol === '.' ? unit : unit * 3;
    osc.start();
    osc.stop(ctx.currentTime + dur / 1000);
    await delay(dur + unit); // intra-symbol + gap
  }
  await delay(unit * 2); // gap between letters
}

// Play full sequence
async function playSequence() {
  for (let letter of sequence) {
    await playLetter(letter);
  }
}

// Start new test
function startHearingTest() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  sequence = [];
  for (let i = 0; i < 5; i++) {
    sequence.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  // Reset displays
  correctSeqDisplay.textContent = '- - - - -';
  userSeqDisplay.textContent = '- - - - -';
  hearingInput.value = '';
  // hearingInput.disabled = true;

  hearingTime.textContent = '0';
  hearingCorrectDisplay.textContent = '0';
  hearingAccuracyDisplay.textContent = '0%';

  // Play sequence, then enable typing
  playSequence().then(() => {
    // hearingInput.disabled = false;
    hearingInput.focus();
    startTime = Date.now();
  });
}

// When user finishes typing
hearingInput.addEventListener('input', () => {
  const userInput = hearingInput.value.toUpperCase();

  // Live update as user types (just plain text until finished)
  userSeqDisplay.textContent = userInput;

  if (userInput.length >= sequence.length) {
    // hearingInput.disabled = true;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Count corrects + build colored sequence
    let correct = 0;
    userSeqDisplay.innerHTML = ''; // reset
    for (let i = 0; i < sequence.length; i++) {
      const span = document.createElement('span');
      const expected = sequence[i];
      const typed = userInput[i] || '';

      span.textContent = typed;
      if (typed === expected) {
        span.style.color = 'green';
        correct++;
      } else {
        span.style.color = 'red';
      }
      userSeqDisplay.appendChild(span);
    }

    const accuracy = ((correct / sequence.length) * 100).toFixed(1);

    hearingTime.textContent = elapsed;
    hearingCorrectDisplay.textContent = correct;
    hearingAccuracyDisplay.textContent = accuracy + '%';

    // Show correct sequence as plain reference
    correctSeqDisplay.textContent = sequence.join('');

    // Save to history
    const row = document.createElement('tr');
    row.innerHTML = `<td>${elapsed}</td><td>${correct}</td><td>${accuracy}%</td>`;
    hearingHistoryBody.appendChild(row);
  }
});

// Hook start button
startBtn.addEventListener('click', startHearingTest);

// Update WPM slider display
hearingSpeedSlider.addEventListener('input', () => {
  hearingSpeedValue.textContent = hearingSpeedSlider.value;
});