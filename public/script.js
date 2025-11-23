// If not on typing test page, disable all typing logic
if (!document.getElementById('typing')) {
  // We are NOT on index.html (typing test page), so stop script.js execution
  console.log("Typing test JS disabled on this page");
  throw new Error("Skip Typing Test script on non-typing pages");
}

let morseSequence = '';
let pressStart = 0;
let testStartTime = null;
let decoded = '';
let lastKeyTime = Date.now();
let targetPhrase = '';
let currentPhraseIndex = 0;
let decodeTimeout = null;
let wordTimeout = null;
let testEnded = false;

const API_URL = "https://dotdash-morse-backend.onrender.com";
const morseSequenceDisplay = document.getElementById('morseSequenceDisplay');
const decodedTextDiv = document.getElementById('decodedText');
const timeSpan = document.getElementById('time');
const charsSpan = document.getElementById('chars');

const dotDurationSlider = document.getElementById('dotDurationSlider');
const dotDurationValue = document.getElementById('dotDurationValue');

let dotDuration = parseInt(dotDurationSlider.value);

dotDurationSlider.addEventListener('input', (e) => {
  dotDuration = parseInt(e.target.value);
  dotDurationValue.textContent = dotDuration;
});

const morseToText = {
  ".-": "A", "-...": "B", "-.-.": "C",
  "-..": "D", ".": "E", "..-.": "F",
  "--.": "G", "....": "H", "..": "I",
  ".---": "J", "-.-": "K", ".-..": "L",
  "--": "M", "-.": "N", "---": "O",
  ".--.": "P", "--.-": "Q", ".-.": "R",
  "...": "S", "-": "T", "..-": "U",
  "...-": "V", ".--": "W", "-..-": "X",
  "-.--": "Y", "--..": "Z",
  "-----": "0", ".----": "1", "..---": "2",
  "...--": "3", "....-": "4", ".....": "5",
  "-....": "6", "--...": "7", "---..": "8",
  "----.": "9"
};

document.addEventListener('keydown', (e) => {
  if (testEnded) return; // ✅ ignore input if test already finished

  const key = e.key;

  if (key === 'q' || key === 'w' || key === '.' || key === '-') {
    const morseChar = (key === 'q' || key === '.') ? '.' : '-';

    morseSequence += morseChar;
    updateMorseDisplay();
    lastKeyTime = Date.now();

    if (decodeTimeout) clearTimeout(decodeTimeout);
    if (wordTimeout) clearTimeout(wordTimeout);

    decodeTimeout = setTimeout(() => {
      if (Date.now() - lastKeyTime >= dotDuration * 3) {
        decodeMorseCharacter();

        wordTimeout = setTimeout(() => {
          decoded += ' ';
          updateDecodedText();
          updateStats();
        }, dotDuration * 7 - dotDuration * 3);
      }
    }, dotDuration * 3 + 20);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === ' ') e.preventDefault();
});

function updateMorseDisplay() {
  morseSequenceDisplay.textContent = morseSequence;
}

function updateDecodedText() {
  if (testEnded) return; // ✅ don’t touch decoded box after test ends

  const container = document.getElementById('decodedText');
  container.innerHTML = '';

  for (let i = 0; i < decoded.length; i++) {
    const span = document.createElement('span');
    const expectedChar = targetPhrase[i] || '';
    const typedChar = decoded[i];

    span.textContent = typedChar;
    span.style.color = typedChar === expectedChar ? 'green' : 'red';
    container.appendChild(span);
  }

  for (let i = decoded.length; i < targetPhrase.length; i++) {
    const span = document.createElement('span');
    span.textContent = targetPhrase[i];
    span.style.color = '#ccc';
    container.appendChild(span);
  }
}

function decodeMorseCharacter() {
  if (!morseSequence.trim()) return;

  const trimmed = morseSequence.trim();
  const letter = morseToText[trimmed];
  decoded += letter ? letter : '?';

  updateDecodedText();
  morseSequence = '';
  updateMorseDisplay();
  updateStats();

  // ✅ End test once user typed as many characters as the target phrase
  if (decoded.length >= targetPhrase.length) {
    endTest();
  }
}

function endTest() {
  if (decoded.length < targetPhrase.length) return;

  if (testStartTime && decoded.length > 0) {
    const elapsedSeconds = ((Date.now() - testStartTime) / 1000).toFixed(1);
    const characters = decoded.length;
    const words = characters / 5;
    const wpm = ((words / (elapsedSeconds / 60)) || 0).toFixed(2);

    fetch('${API_URL}/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: elapsedSeconds, characters, wpm, user: currentUser || 'guest' })
    });

    const row = document.createElement('tr');
    row.innerHTML = `<td>${currentUser || 'guest'}</td><td>${elapsedSeconds}</td><td>${characters}</td><td>${wpm}</td>`;
    document.getElementById('historyBody').appendChild(row);

    // Lock typing
    testEnded = true;
    testStartTime = null;

    // Hide typing area
    document.getElementById('typingArea').style.display = "none";

    // Show results using same layout
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.style.display = "flex"; // same as .morse-decoded-container
    resultsArea.innerHTML = `
      <div class="morse-display">
        <div class="field-label">Current Morse</div>
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#94a3b8;">
          Дууссан
        </div>
      </div>

      <div class="decoded-text">
        <div class="field-label">Үр дүн</div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; gap:20px;">
          <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
            
            <span><strong>Хугацаа:</strong> ${elapsedSeconds} s</span>
            <span><strong>Үсэгний тоо:</strong> ${characters}</span>
            <span><strong>WPM:</strong> ${wpm}</span>
          </div>
          <button id="restartBtn">Дахин эхлэх</button>
        </div>
      </div>
    `;
    document.getElementById('restartBtn').addEventListener('click', restartTest);
  }
}

function updateStats() {
  if (!testStartTime) testStartTime = Date.now();

  const elapsedSeconds = (Date.now() - testStartTime) / 1000;
  const elapsedMinutes = elapsedSeconds / 60;
  const characters = decoded.length;
  const wordsTyped = characters / 5;
  const wpm = elapsedMinutes > 0 ? (wordsTyped / elapsedMinutes).toFixed(2) : 0;

  let correctChars = 0;
  for (let i = 0; i < decoded.length; i++) {
    if (decoded[i] === (targetPhrase[i] || '')) {
      correctChars++;
    }
  }
  const accuracy = characters > 0 ? ((correctChars / characters) * 100).toFixed(2) : 100;

  timeSpan.textContent = elapsedSeconds.toFixed(1);
  charsSpan.textContent = characters;
  document.getElementById('wpm').textContent = wpm;
  document.getElementById('accuracy').textContent = accuracy + '%';
}

// ✅ New Restart Logic
function restartTest() {
  morseSequence = '';
  decoded = '';
  pressStart = 0;
  testStartTime = null;
  testEnded = false; // ✅ unlock typing

  document.getElementById('resultsArea').style.display = "none";
  document.getElementById('typingArea').style.display = "flex";

  morseSequenceDisplay.textContent = '';
  decodedTextDiv.innerHTML = '';
  updateDecodedText();

  timeSpan.textContent = '0';
  charsSpan.textContent = '0';
  document.getElementById('wpm').textContent = '0';
  document.getElementById('accuracy').textContent = '0%';

  // Load phrase immediately on page load
  fetch('${API_URL}/api/phrases')
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const phraseObj = data[Math.floor(Math.random() * data.length)];
        targetPhrase = phraseObj.text || "NO PHRASE";
        updateTargetDisplay();
      } else {
        targetPhrase = "No phrases found";
        updateTargetDisplay();
      }
    })
    .catch(err => {
      console.error('Failed to load phrases:', err);
      targetPhrase = "Failed to load phrases";
      updateTargetDisplay();
    });
}

document.getElementById('restartBtn').addEventListener('click', restartTest);

fetch('${API_URL}/api/results')
  .then(res => res.json())
  .then(data => {
    document.getElementById('historyBody').innerHTML = '';
    const filtered = currentUser ? data.filter(r => r.user === currentUser) : [];
    filtered.forEach(({ user, time, characters, wpm }) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${user || 'guest'}</td><td>${time}</td><td>${characters}</td><td>${wpm}</td>`;
      document.getElementById('historyBody').appendChild(row);
    });
  });

fetch('${API_URL}/api/phrases')
  .then(response => response.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const phraseObj = data[Math.floor(Math.random() * data.length)];
      targetPhrase = phraseObj.text || "NO PHRASE";
      updateTargetDisplay();
    } else {
      targetPhrase = "No phrases found";
      updateTargetDisplay();
    }
  })
  .catch(err => {
    console.error('Failed to load phrases:', err);
    targetPhrase = "Failed to load phrases";
    updateTargetDisplay();
  });

function updateTargetDisplay() {
  document.getElementById('targetPhraseDisplay').textContent = targetPhrase;
}

// ====== ACCOUNT MODAL / SIGNUP & LOGIN ======
document.querySelectorAll('.signup').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupModal').style.display = 'flex';
  });
});

document.querySelector('.signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('${API_URL}/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById('signupModal').style.display = 'none';
      document.querySelector('.signup-form').reset();
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Бүртгэл амжилтгүй боллоо.');
  }
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('signupModal').style.display = 'none';
});

// ====== LOGIN MODAL ======
const loginModalHTML = `
<div class="modal" id="loginModal">
  <div class="modal-content">
    <span class="close-btn" id="closeLoginModal">&times;</span>
    <h2>Нэвтрэх</h2>
    <form id="loginForm">
      <div class="form-group">
        <label>Хэрэглэгчийн нэр</label>
        <input type="text" id="loginUsername" required>
      </div>
      <div class="form-group">
        <label>Нууц үг</label>
        <input type="password" id="loginPassword" required>
      </div>
      <button type="submit">Нэвтрэх</button>
    </form>
  </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', loginModalHTML);

const loginBtn = document.createElement('a');
loginBtn.href = "#";
loginBtn.textContent = "Нэвтрэх";
loginBtn.className = "nav-link signup";
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginModal').style.display = 'flex';
});
document.querySelector('.nav-links').appendChild(loginBtn);

document.getElementById('closeLoginModal').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'none';
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch('${API_URL}/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('loginForm').reset();
      currentUser = username;
      localStorage.setItem('dotdashUser', username);
      updateHeader();
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Нэвтрэлт амжилтгүй боллоо.');
  }
});

window.addEventListener('click', (e) => {
  const signupModal = document.getElementById('signupModal');
  const loginModal = document.getElementById('loginModal');
  if (e.target === signupModal) signupModal.style.display = 'none';
  if (e.target === loginModal) loginModal.style.display = 'none';
});

// ====== SESSION MANAGEMENT ======
let currentUser = localStorage.getItem('dotdashUser') || null;

function updateHeader() {
  const navLinks = document.querySelector('.nav-links');
  const existingUser = document.getElementById('loggedUserDisplay');
  if (existingUser) existingUser.remove();
  const existingLogout = document.getElementById('logoutBtn');
  if (existingLogout) existingLogout.remove();

  if (currentUser) {
    document.querySelectorAll('.nav-link.signup').forEach(btn => btn.style.display = 'none');

    const userDisplay = document.createElement('span');
    userDisplay.id = 'loggedUserDisplay';
    userDisplay.textContent = `${currentUser}`;
    userDisplay.style.marginLeft = '15px';
    userDisplay.style.color = '#1e293b';
    navLinks.appendChild(userDisplay);

    const logoutBtn = document.createElement('a');
    logoutBtn.href = "#";
    logoutBtn.id = 'logoutBtn';
    logoutBtn.textContent = 'Гарах';
    logoutBtn.className = 'nav-link';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('dotdashUser');
      updateHeader();
      alert('Амжилттай системээс гарлаа.');
    });
    navLinks.appendChild(logoutBtn);
  } else {
    document.querySelectorAll('.nav-link.signup').forEach(btn => btn.style.display = 'inline-block');
  }
}

updateHeader();