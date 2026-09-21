(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const levelValue = document.getElementById('levelValue');
  const keysValue = document.getElementById('keysValue');
  const keysTotal = document.getElementById('keysTotal');
  const timeValue = document.getElementById('timeValue');
  const bestValue = document.getElementById('bestValue');

  const overlay = document.getElementById('overlay');
  const overlayIcon = document.getElementById('overlayIcon');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');

  const TILE = 48;
  const COLS = 15;
  const ROWS = 15;

  const levels = [
    [
      "###############",
      "#P....#....K..#",
      "#.###.#.#####.#",
      "#...#.#.....#.#",
      "###.#.#####.#.#",
      "#...#.....#.#.#",
      "#.#######.#.#.#",
      "#.....K.#.#...#",
      "#.#####.#.###.#",
      "#.#...#.#...#.#",
      "#.#.#.#.###.#.#",
      "#...#.#...#...#",
      "#.###.###.#.###",
      "#K......T....D#",
      "###############"
    ],
    [
      "###############",
      "#P..#....K....#",
      "###.#.#######.#",
      "#...#.....#...#",
      "#.#######.#.###",
      "#...K...#.#...#",
      "#.#####.#.###.#",
      "#.....#.#...#.#",
      "#####.#.###.#.#",
      "#...#.#...#.#.#",
      "#.#.#.###.#.#.#",
      "#.#...#...#...#",
      "#.#####.#####.#",
      "#K....T......D#",
      "###############"
    ],
    [
      "###############",
      "#P....#....K..#",
      "#.##T.#.#####.#",
      "#....##.....#.#",
      "####....###.#.#",
      "#K...##...#.#.#",
      "#.##.####.#.#.#",
      "#..#....#.#...#",
      "##.####.#.###.#",
      "#...T.#.#...#.#",
      "#.###.#.###.#.#",
      "#...#.#.....#.#",
      "###.#.#######.#",
      "#K.........T.D#",
      "###############"
    ]
  ];

  let levelIndex = 0;
  let map = [];
  let player = {x:1,y:1};
  let keysCollected = 0;
  let totalKeys = 0;
  let running = false;
  let timeLeft = 60;
  let timerId = null;

  function loadLevel(index) {
    levelIndex = index % levels.length;
    map = levels[levelIndex].map(row => row.split(''));
    keysCollected = 0;
    totalKeys = 0;
    timeLeft = 60 + levelIndex * 10;

    for (let y=0;y<ROWS;y++) {
      for (let x=0;x<COLS;x++) {
        const cell = map[y][x];
        if (cell === 'P') {
          player = {x,y};
          map[y][x] = '.';
        }
        if (cell === 'K') totalKeys++;
      }
    }

    levelValue.textContent = String(levelIndex + 1);
    keysValue.textContent = '0';
    keysTotal.textContent = String(totalKeys);
    timeValue.textContent = String(timeLeft);
    updateBest();
    draw();
  }

  function updateBest() {
    const value = localStorage.getItem('vertexMazeBestLevel' + levelIndex);
    bestValue.textContent = value ? value + 'ث' : '--';
  }

  function saveBest(secondsUsed) {
    const key = 'vertexMazeBestLevel' + levelIndex;
    const current = Number(localStorage.getItem(key));
    if (!current || secondsUsed < current) {
      localStorage.setItem(key,String(secondsUsed));
    }
    updateBest();
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (!running) return;
      timeLeft--;
      timeValue.textContent = String(timeLeft);

      if (timeLeft <= 0) {
        fail('انتهى الوقت!', '⏰');
      }
    },1000);
  }

  function startGame() {
    running = true;
    overlay.classList.remove('show');
    startTimer();
    canvas.focus();
  }

  function restartLevel() {
    running = false;
    clearInterval(timerId);
    loadLevel(levelIndex);
    showOverlay('🧭','جاهز للهروب؟','اجمع المفاتيح ثم اتجه إلى الباب.','ابدأ اللعبة');
  }

  function nextLevel() {
    running = false;
    clearInterval(timerId);

    const secondsUsed = (60 + levelIndex * 10) - timeLeft;
    saveBest(secondsUsed);

    showOverlay('🏆','نجحت!','أنهيت المرحلة في ' + secondsUsed + ' ثانية.','المرحلة التالية',() => {
      loadLevel(levelIndex + 1);
      startGame();
    });
  }

  function fail(message, icon) {
    running = false;
    clearInterval(timerId);
    showOverlay(icon,'انتهت المحاولة',message,'حاول مرة ثانية',() => {
      loadLevel(levelIndex);
      startGame();
    });
  }

  function showOverlay(icon,title,text,buttonText,onClick) {
    overlayIcon.textContent = icon;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = buttonText;
    startBtn.onclick = onClick || startGame;
    overlay.classList.add('show');
  }

  function move(dx,dy) {
    if (!running) return;

    const nx = player.x + dx;
    const ny = player.y + dy;
    const cell = map[ny]?.[nx];

    if (!cell || cell === '#') return;

    player.x = nx;
    player.y = ny;

    if (cell === 'K') {
      keysCollected++;
      keysValue.textContent = String(keysCollected);
      map[ny][nx] = '.';
    }

    if (cell === 'T') {
      fail('وقعت في فخ!','⚠️');
      return;
    }

    if (cell === 'D') {
      if (keysCollected >= totalKeys) {
        nextLevel();
        return;
      } else {
        showHint();
      }
    }

    draw();
  }

  function showHint() {
    const missing = totalKeys - keysCollected;
    overlayIcon.textContent = '🔒';
    overlayTitle.textContent = 'الباب مقفل';
    overlayText.textContent = 'باقي لك ' + missing + ' مفتاح.';
    startBtn.textContent = 'كمل اللعب';
    startBtn.onclick = () => overlay.classList.remove('show');
    overlay.classList.add('show');
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const gradient = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    gradient.addColorStop(0,'#07111c');
    gradient.addColorStop(1,'#0a1524');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let y=0;y<ROWS;y++) {
      for (let x=0;x<COLS;x++) {
        const cell = map[y][x];
        const px = x*TILE;
        const py = y*TILE;

        if (cell === '#') {
          const wall = ctx.createLinearGradient(px,py,px+TILE,py+TILE);
          wall.addColorStop(0,'#263852');
          wall.addColorStop(1,'#152238');
          ctx.fillStyle = wall;
          ctx.fillRect(px,py,TILE,TILE);
          ctx.strokeStyle = 'rgba(110,160,255,.18)';
          ctx.strokeRect(px+.5,py+.5,TILE-1,TILE-1);
        } else {
          ctx.fillStyle = ((x+y)%2===0) ? '#0a1624' : '#0b1828';
          ctx.fillRect(px,py,TILE,TILE);

          if (cell === 'K') drawEmoji('🔑',px,py);
          if (cell === 'T') drawEmoji('⚠️',px,py);
          if (cell === 'D') drawEmoji(keysCollected>=totalKeys ? '🚪' : '🔒',px,py);
        }
      }
    }

    drawPlayer();
  }

  function drawEmoji(emoji,px,py) {
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji,px+TILE/2,py+TILE/2+1);
  }

  function drawPlayer() {
    const cx = player.x*TILE + TILE/2;
    const cy = player.y*TILE + TILE/2;

    ctx.shadowColor = '#27dce8';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#27dce8';
    ctx.beginPath();
    ctx.arc(cx,cy,15,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#07111f';
    ctx.beginPath();
    ctx.arc(cx-5,cy-3,2,0,Math.PI*2);
    ctx.arc(cx+5,cy-3,2,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = '#07111f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx,cy+2,6,.2*Math.PI,.8*Math.PI);
    ctx.stroke();
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    const directions = {
      arrowup:[0,-1],
      w:[0,-1],
      arrowdown:[0,1],
      s:[0,1],
      arrowleft:[-1,0],
      a:[-1,0],
      arrowright:[1,0],
      d:[1,0]
    };

    if (!directions[key]) return;
    event.preventDefault();
    move(...directions[key]);
  }

  document.addEventListener('keydown',handleKey,{passive:false});

  document.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('click',() => {
      const dir = button.dataset.dir;
      const mapDir = {
        up:[0,-1],
        down:[0,1],
        left:[-1,0],
        right:[1,0]
      };
      move(...mapDir[dir]);
    });
  });

  restartBtn.addEventListener('click',restartLevel);
  startBtn.addEventListener('click',startGame);

  loadLevel(0);
})();