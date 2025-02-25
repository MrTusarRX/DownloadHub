function loadPage() {
    if (!window.location.hash || window.location.hash === "#") {
        window.location.hash = "#!/home";
        return;
    }

    const hash = window.location.hash;
    const parts = hash.split('/');
    const route = parts[1] || 'home';
    const gameId = parts[2] || null;

    let page = '';

    if (route === 'home') {
        page = 'pages/home.html';
    } else if (route === 'game' && gameId) {
        page = 'pages/game.html';
    } else {
        page = 'pages/home.html';
    }

    fetch(page)
        .then(response => response.text())
        .then(html => {
            document.getElementById('app').innerHTML = html; 

            if (route === 'home') {
                LoadHot();
                applyLogoAnimation();
                gamelists();
            }
            if (route === 'game' && gameId) {
                setTimeout(() => {
                    loadGameDetails(gameId);
                }, 100); 
            }
        })
        .catch(error => console.error('Error loading page:', error));
}


function LoadHot() {
  fetch('./admin/games.json')
      .then(response => response.json())
      .then(games => {
          const lastThreeGames = Object.entries(games).slice(-3);

          const container = document.getElementById('editorsChoice');
          container.innerHTML = ''; 

          lastThreeGames.forEach(([id, game]) => {
              const slideItem = document.createElement('div');
              slideItem.classList.add('slide-item');
              slideItem.innerHTML = `
                  <div class="vid poster">
                      <a href="#!/game/${id}" title="${game.name}">
                          <img src="${game.img}" class="rounded" alt="${game.name}" style="inline-size: 100%; min-block-size: 100%; min-inline-size: 100%; block-size: 200px;">
                      </a>
                  </div>
                  <div class="box-app">
                      <a href="#!/game/${id}">
                          <dl class="item">
                              <dt class="ic-app">
                                  <img width="512" height="512" src="${game.img}" class="rounded wp-post-image" alt="${game.name}" sizes="(max-inline-size: 512px) 100vw, 512px">
                              </dt>
                              <dd class="title">${game.name}</dd>
                              <dd class="info-app" style="white-space: nowrap;">
                                  <span class="size" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; inline-size: 260px;">MOD MENU</span>
                              </dd>
                          </dl>
                      </a>
                  </div>
              `;
              container.appendChild(slideItem);
          });
      })
      .catch(error => console.error('Error loading games.json:', error));
}



function loadGameDetails(gameId) {
    fetch('./admin/games.json')
        .then(response => response.json())
        .then(games => {
            const game = games[gameId];
            if (game) {
                document.getElementById('game-title').textContent = game.name;
                document.getElementById('game-image').src = game.img;
                document.getElementById('game-plalink').href = game.img2;
                document.getElementById('game-size').textContent = game.size;
                document.getElementById('game-call').textContent = game.name;
                document.getElementById('game-update').textContent = game.game_update;
                document.getElementById('game-mymod_update').textContent = game.mymod_update;
                document.getElementById('game-gameinfo').textContent = game.gameinfo;
                document.getElementById('game-description').textContent = game.dis;
                document.getElementById('game-size').textContent = game.size;
                document.getElementById('game-download').href = game.game_Link;
                document.getElementById('game-gameinfo').innerHTML = game.gameinfo;
                document.getElementById('game-version').textContent = game.version;
                document.getElementById('total-installs').textContent = "10,000,000+";
                document.getElementById('game-rating').textContent = "4.6";
                document.getElementById('rating-count').textContent = "764";
                document.getElementById('game-price').textContent = "$0";
                document.getElementById('game-details').style.display = 'block';
            } else {
                document.getElementById('game-details').innerHTML = '<p>Game not found.</p>';
            }
        })
        .catch(error => console.error('Error loading games.json:', error));
}








function gamelists() {
  fetch('./admin/games.json')
      .then(response => response.json())
      .then(games => {
          const container = document.getElementById('gameList');
          container.innerHTML = ''; 

          Object.entries(games).forEach(([id, game]) => {
              const gameItem = document.createElement('div');
              gameItem.classList.add('col-12', 'col-md-6', 'col-xl-4', 'mb-3', 'post-id-755', 'post-view-count-7901');

              gameItem.innerHTML = `
                  <a class="text-body border rounded overflow-hidden d-block h-100 position-relative archive-post" 
                   href="#!/game/${id}" title="${game.name}">
                      <div class="d-flex" style="padding: 0.5rem;">
                          <div class="flex-shrink-0 mr-2" style="inline-size: 3.75rem;">
                              <img data-lazyloaded="1" src="${game.img}" data-src="${game.img}" 
                                   class="rounded-lg wp-post-image entered litespeed-loaded" 
                                   alt="${game.name}" width="120" height="120">
                              <noscript>
                                  <img src="${game.img}" class="rounded-lg wp-post-image" alt="${game.name}" width="120" height="120">
                              </noscript>
                          </div>
                          <div style="min-inline-size: 0;">
                              <h3 class="h6 font-weight-semibold text-truncate w-100" style="margin-block-end: 2px;">
                                  ${game.name}
                              </h3>
                              <div class="small text-truncate text-muted">
                                  <svg class="svg-6 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                      <path d="M567.938 243.908L462.25 85.374A48.003 48.003 0 0 0 422.311 64H153.689a48 48 0 0 0-39.938 21.374L8.062 243.908A47.994 47.994 0 0 0 0 270.533V400c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V270.533a47.994 47.994 0 0 0-8.062-26.625zM162.252 128h251.497l85.333 128H376l-32 64H232l-32-64H76.918l85.334-128z"></path>
                                  </svg>
                                  <span class="align-middle">${game.version}</span>
                                  <span class="align-middle"> + </span>
                                  <span class="align-middle">${game.size}</span>
                              </div>
                              <div class="small text-truncate text-muted">
                                  <svg class="svg-6 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                      <path d="M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 49.7-89.3 37.9-136.7-2.2-9-13.5-12.1-20.1-5.5l-74.4 74.4-67.9-11.3L334 98.9l74.4-74.4c6.6-6.6 3.4-17.9-5.7-20.2-47.4-11.7-99.6.9-136.6 37.9-28.5 28.5-41.9 66.1-41.2 103.6l82.1 82.1c8.1-1.9 16.5-2.9 24.7-2.9z"></path>
                                  </svg>
                                  <span class="align-middle"> MENU</span>
                              </div>
                          </div>
                      </div>
                  </a>
              `;
              container.appendChild(gameItem);
          });
      })
      .catch(error => console.error('Error loading games.json:', error));
}
function applyLogoAnimation() {
  const logo = document.querySelector("h1.site-logo a");
  if (!logo) return;
  if (logo.querySelector("span")) return;

  const text = logo.textContent.trim();
  logo.innerHTML = ""; 

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.setProperty("--char-index", index);
    logo.appendChild(span);
  });
}

document.addEventListener("DOMContentLoaded", applyLogoAnimation);
const observer = new MutationObserver(() => {
  applyLogoAnimation();
});
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', loadPage);
loadPage();
