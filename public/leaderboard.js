const API_URL = "https://dotdash-morse-backend.onrender.com";

fetch('${API_URL}/api/results')
  .then(res => res.json())
  .then(data => {
    const leaderboardBody = document.getElementById('leaderboardBody');

    // Sort by WPM descending
    data.sort((a, b) => b.wpm - a.wpm);

    data.forEach(({ user, time, characters, wpm }) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${user || 'guest'}</td><td>${time}</td><td>${characters}</td><td>${wpm}</td>`;
      leaderboardBody.appendChild(row);
    });
  });
