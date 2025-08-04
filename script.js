// O código é executado apenas quando a página estiver totalmente carregada
window.onload = function() {
  // Mensagem de depuração para confirmar que o script foi carregado e o DOM está pronto.
  console.log("O evento window.onload foi acionado. A página está pronta.");

  // Obtém elementos do DOM
  const startBtn = document.getElementById("start-btn");
  const canvas = document.querySelector("#canvas");
  const startScreen = document.querySelector(".start-screen");
  const checkpointScreen = document.querySelector(".checkpoint-screen");
  const checkpointMessage = document.querySelector("#checkpoint-message");
  const gameOverScreen = document.querySelector(".game-over-screen");
  const gameOverMessage = document.getElementById("game-over-message");
  const restartBtn = document.getElementById("restart-btn");
  const ctx = canvas.getContext("2d");

  // Se o botão de início não for encontrado, é impresso um erro na consola
  if (!startBtn) {
    console.error("Erro: O botão 'start-btn' não foi encontrado no HTML.");
  } else {
    console.log("Botão de início encontrado:", startBtn);
  }

  // Configura o tamanho do canvas para ser responsivo
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Variáveis de estado do jogo
  const gravity = 0.5;
  let isCheckpointCollisionDetectionActive = true;
  let currentLevel = 0;
  let keys = {
    rightKey: {
      pressed: false,
    },
    leftKey: {
      pressed: false,
    },
  };
  // Variável para armazenar o ID do loop de animação, corrigindo o problema de velocidade
  let animationFrameId;

  // FUNÇÃO PARA REDIMENSIONAR ELEMENTOS PROPORCIONALMENTE - MOVIDA PARA O INÍCIO
  // A função deve ser declarada antes de ser utilizada para evitar erros de referência.
  const proportionalSize = (size) => {
    return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
  };

  // Definição dos 10 níveis do jogo com plataformas mais baixas e checkpoints mais próximos
  const levels = [{
    platforms: [{ x: 500, y: 550 }, { x: 700, y: 500 }, { x: 850, y: 450 }, { x: 900, y: 450 }],
    checkpoints: [{ x: 1050, y: 180, z: 1 }], // Posição ajustada
    spikes: [{ x: 600, y: 550 }, { x: 800, y: 450 }],
  }, {
    platforms: [{ x: 500, y: 500 }, { x: 800, y: 400 }, { x: 1100, y: 300 }, { x: 1400, y: 200 }],
    checkpoints: [{ x: 1500, y: 150, z: 2 }], // Posição ajustada
    spikes: [{ x: 650, y: 500 }, { x: 1000, y: 400 }, { x: 1300, y: 300 }],
  }, {
    platforms: [{ x: 200, y: 550 }, { x: 400, y: 500 }, { x: 600, y: 450 }, { x: 800, y: 400 }, { x: 1000, y: 350 }],
    checkpoints: [{ x: 1150, y: 300, z: 3 }], // Posição ajustada
    spikes: [{ x: 300, y: 550 }, { x: 700, y: 450 }, { x: 900, y: 400 }],
  }, {
    platforms: [{ x: 500, y: 550 }, { x: 700, y: 450 }, { x: 900, y: 350 }, { x: 1100, y: 250 }],
    checkpoints: [{ x: 1200, y: 200, z: 4 }], // Posição ajustada
    spikes: [{ x: 600, y: 550 }, { x: 800, y: 450 }, { x: 1000, y: 350 }],
  }, {
    platforms: [{ x: 200, y: 500 }, { x: 400, y: 400 }, { x: 600, y: 300 }, { x: 800, y: 200 }],
    checkpoints: [{ x: 900, y: 150, z: 5 }], // Posição ajustada
    spikes: [{ x: 300, y: 500 }, { x: 500, y: 400 }, { x: 700, y: 300 }],
  }, {
    platforms: [{ x: 500, y: 550 }, { x: 800, y: 500 }, { x: 1100, y: 450 }, { x: 1400, y: 400 }],
    checkpoints: [{ x: 1500, y: 350, z: 6 }], // Posição ajustada
    spikes: [{ x: 650, y: 550 }, { x: 950, y: 500 }, { x: 1250, y: 450 }],
  }, {
    platforms: [{ x: 200, y: 500 }, { x: 400, y: 400 }, { x: 600, y: 300 }, { x: 800, y: 200 }],
    checkpoints: [{ x: 900, y: 150, z: 7 }], // Posição ajustada
    spikes: [{ x: 300, y: 500 }, { x: 500, y: 400 }, { x: 700, y: 300 }],
  }, {
    platforms: [{ x: 500, y: 550 }, { x: 700, y: 500 }, { x: 900, y: 450 }, { x: 1100, y: 400 }],
    checkpoints: [{ x: 1200, y: 350, z: 8 }], // Posição ajustada
    spikes: [{ x: 600, y: 550 }, { x: 800, y: 500 }, { x: 1000, y: 450 }],
  }, {
    platforms: [{ x: 200, y: 550 }, { x: 400, y: 500 }, { x: 600, y: 450 }, { x: 800, y: 400 }, { x: 1000, y: 350 }],
    checkpoints: [{ x: 1150, y: 300, z: 9 }], // Posição ajustada
    spikes: [{ x: 300, y: 550 }, { x: 700, y: 450 }, { x: 900, y: 400 }],
  }, { // Fase 10 (index 9)
    platforms: [{ x: 500, y: 500 }, { x: 800, y: 400 }, { x: 1100, y: 300 }, { x: 1400, y: 200 }],
    checkpoints: [{ x: -200, y: proportionalSize(400), z: 10 }], // Checkpoint no começo, fora da tela
    spikes: [{ x: 650, y: 500 }, { x: 1000, y: 400 }, { x: 1300, y: 300 }],
  },];


  // Classes do jogo
  class Player {
    constructor() {
      this.position = {
        x: proportionalSize(10),
        y: proportionalSize(400),
      };
      this.velocity = {
        x: 0,
        y: 0,
      };
      this.width = proportionalSize(40);
      this.height = proportionalSize(40);
      this.jumpCount = 0;
      this.maxJumps = 2; // Pulo duplo habilitado
    }

    draw() {
      ctx.fillStyle = "#99c9ff";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
      this.draw();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      // Lógica para colisões com o chão e borda do canvas
      if (this.position.y + this.height + this.velocity.y <= canvas.height) {
        if (this.position.y < 0) {
          this.position.y = 0;
        }
        this.velocity.y += gravity;
      } else {
        this.velocity.y = 0;
        this.position.y = canvas.height - this.height;
        this.jumpCount = 0; // Reseta o contador de pulos quando o jogador está no chão
      }

      if (this.position.x < proportionalSize(10)) {
        this.position.x = proportionalSize(10);
      }

      if (this.position.x >= canvas.width - this.width * 2) {
        this.position.x = canvas.width - this.width * 2;
      }
    }
  }

  class Platform {
    constructor(x, y) {
      this.position = {
        x,
        y,
      };
      this.width = 200;
      this.height = proportionalSize(40);
    }

    draw() {
      ctx.fillStyle = "#c99a99";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  class CheckPoint {
    constructor(x, y, z) {
      this.position = {
        x,
        y
      };
      this.width = proportionalSize(40);
      this.height = proportionalSize(70);
      this.claimed = false;
    }
    draw() {
      ctx.fillStyle = "#f1be32";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    claim() {
      this.width = 0;
      this.height = 0;
      this.position.y = Infinity;
      this.claimed = true;
    }
  }

  class Spike {
    constructor(x, y) {
      this.position = {
        x,
        y
      };
      this.width = proportionalSize(60);
      this.height = proportionalSize(20);
    }

    draw() {
      ctx.fillStyle = "#ff5722";
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y + this.height);
      ctx.lineTo(this.position.x + this.width * 0.25, this.position.y);
      ctx.lineTo(this.position.x + this.width * 0.5, this.position.y + this.height);
      ctx.lineTo(this.position.x + this.width * 0.75, this.position.y);
      ctx.lineTo(this.position.x + this.width, this.position.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Criação dos objetos de jogo
  let player;
  let platforms = [];
  let checkpoints = [];
  let spikes = [];

  // Inicializa a fase atual
  const initLevel = () => {
    const levelData = levels[currentLevel];
    player = new Player();
    platforms = levelData.platforms.map((pos) => new Platform(pos.x, proportionalSize(pos.y)));
    checkpoints = levelData.checkpoints.map((pos) => new CheckPoint(pos.x, proportionalSize(pos.y), pos.z));
    spikes = levelData.spikes.map((pos) => new Spike(pos.x, proportionalSize(pos.y)));
    // Reinicia o estado das teclas para evitar movimento automático
    keys.rightKey.pressed = false;
    keys.leftKey.pressed = false;
  };

  // Funções da tela
  const showCheckpointScreen = (msg) => {
    checkpointScreen.style.display = "block";
    checkpointMessage.textContent = msg;
    setTimeout(() => {
      checkpointScreen.style.display = "none";
    }, 2000);
  };

  const showGameOverScreen = (msg) => {
    gameOverScreen.style.display = "block";
    gameOverMessage.textContent = msg;
    isCheckpointCollisionDetectionActive = false;
  };

  // Lógica de reinício
  const restartLevel = () => {
    gameOverScreen.style.display = "none";
    initLevel();
    isCheckpointCollisionDetectionActive = true;
    // Cancela o loop de animação anterior antes de iniciar um novo
    cancelAnimationFrame(animationFrameId);
    animate();
  };

  const startGame = () => {
    console.log("A função 'startGame' foi chamada. A iniciar o jogo..."); // Mensagem de depuração
    canvas.style.display = "block";
    startScreen.style.display = "none";
    initLevel();
    // Cancela o loop de animação anterior antes de iniciar um novo
    cancelAnimationFrame(animationFrameId);
    animate();
  };

  // Event Listeners
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
    console.log("Ouvinte de evento 'click' adicionado ao botão de início."); // Mensagem de depuração
  }
  if (restartBtn) {
    restartBtn.addEventListener("click", restartLevel);
  }

  // Loop de animação principal do jogo
  const animate = () => {
    // Armazena o ID para poder cancelar a animação
    animationFrameId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    platforms.forEach((platform) => {
      platform.draw();
    });
    checkpoints.forEach(checkpoint => {
      checkpoint.draw();
    });
    spikes.forEach(spike => {
      spike.draw();
    });

    // Lógica para aumentar a velocidade a partir do nível 3 (currentLevel 2)
    // e inverter os controles a partir do nível 7 (currentLevel 6)
    let speed = (currentLevel >= 2 && currentLevel < 9) ? 6 : 4;
    let moveRight = keys.rightKey.pressed;
    let moveLeft = keys.leftKey.pressed;

    if (currentLevel >= 6 && currentLevel < 9) {
      // Inverte os controles de movimento horizontal
      moveRight = keys.leftKey.pressed;
      moveLeft = keys.rightKey.pressed;
    }

    // Movimento de fundo
    if (moveRight && player.position.x < proportionalSize(400) && isCheckpointCollisionDetectionActive) {
      player.velocity.x = speed;
    } else if (moveLeft && player.position.x > proportionalSize(100) && isCheckpointCollisionDetectionActive) {
      player.velocity.x = -speed;
    } else {
      player.velocity.x = 0;
    }

    if (moveRight && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => {
        platform.position.x -= speed;
      });
      checkpoints.forEach(checkpoint => {
        checkpoint.position.x -= speed;
      });
      spikes.forEach(spike => {
          spike.position.x -= speed;
      });
    } else if (moveLeft && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => {
        platform.position.x += speed;
      });
      checkpoints.forEach(checkpoint => {
        checkpoint.position.x += speed;
      });
      spikes.forEach(spike => {
          spike.position.x += speed;
      });
    }

    // Detecção de colisão com plataformas (melhorada)
    platforms.forEach((platform) => {
      const playerBottom = player.position.y + player.height;
      const platformTop = platform.position.y;
      const platformLeft = platform.position.x;
      const platformRight = platform.position.x + platform.width;
      const playerRight = player.position.x + player.width;

      if (playerBottom <= platformTop &&
          playerBottom + player.velocity.y >= platformTop &&
          playerRight >= platformLeft &&
          player.position.x <= platformRight) {
          player.velocity.y = 0;
          player.position.y = platformTop - player.height;
          player.jumpCount = 0; // Reseta o contador de pulos ao tocar em uma plataforma
      }
    });

    // Detecção de colisão com espinhos
    spikes.forEach(spike => {
      const spikeDetectionRules = [
        player.position.x >= spike.position.x,
        player.position.x <= spike.position.x + spike.width,
        player.position.y + player.height >= spike.position.y,
        player.position.y <= spike.position.y + spike.height
      ];
      if (spikeDetectionRules.every(rule => rule)) {
        showGameOverScreen("Você caiu nos espinhos! Tente de novo.");
      }
    });

    // Detecção de colisão com checkpoints
    checkpoints.forEach((checkpoint, index) => {
      // Regras de detecção de colisão simplificadas para que apenas tocar o bloco amarelo avance a fase.
      const checkpointDetectionRules = [
        player.position.x < checkpoint.position.x + checkpoint.width,
        player.position.x + player.width > checkpoint.position.x,
        player.position.y < checkpoint.position.y + checkpoint.height,
        player.position.y + player.height > checkpoint.position.y,
        isCheckpointCollisionDetectionActive,
        index === 0 || checkpoints[index - 1].claimed
      ];

      if (checkpointDetectionRules.every((rule) => rule)) {
        if (index === checkpoints.length - 1) {
          if (currentLevel < levels.length - 1) {
            isCheckpointCollisionDetectionActive = false;
            // Adiciona uma mensagem para alertar sobre a inversão dos controles na fase 7
            let nextLevelMessage = `Fase ${currentLevel + 1} Concluída! Próxima Fase: ${currentLevel + 2}`;
            if (currentLevel + 1 === 6) {
              nextLevelMessage += " - Cuidado, os controles serão invertidos!";
            }
            if (currentLevel + 1 === 9) {
              nextLevelMessage += " - Última fase! A linha de chegada está no começo do jogo.";
            }
            showCheckpointScreen(nextLevelMessage);
            setTimeout(() => {
              currentLevel++;
              initLevel();
              isCheckpointCollisionDetectionActive = true;
            }, 2000);
          } else {
            isCheckpointCollisionDetectionActive = false;
            showCheckpointScreen("Parabéns, você completou todas as fases!");
            movePlayer("ArrowRight", false);
          }
        } else {
          showCheckpointScreen("Você chegou a um checkpoint!");
        }
        checkpoint.claim();
      }
    });
  };

  // A função movePlayer apenas altera o estado das teclas, mas agora com a lógica de inversão de pulo
  const movePlayer = (key, isPressed) => {
    if (!isCheckpointCollisionDetectionActive) {
      player.velocity.x = 0;
      player.velocity.y = 0;
      return;
    }

    // Lógica para o pulo invertido a partir da fase 7, mas normal na fase 10
    const isJumpKey = (currentLevel >= 6 && currentLevel < 9 && key === "ArrowDown") ||
                      ((currentLevel < 6 || currentLevel === 9) && (key === "ArrowUp" || key === " " || key === "Spacebar"));

    if (isJumpKey && isPressed && player.jumpCount < player.maxJumps) {
      player.velocity.y = -10; // Velocidade de pulo ajustada
      player.jumpCount++;
    }

    // Lógica para o movimento horizontal (a inversão da velocidade é feita no loop 'animate')
    switch (key) {
      case "ArrowLeft":
        keys.leftKey.pressed = isPressed;
        break;
      case "ArrowRight":
        keys.rightKey.pressed = isPressed;
        break;
    }
  };

  window.addEventListener("keydown", ({ key }) => {
    movePlayer(key, true);
  });

  window.addEventListener("keyup", ({ key }) => {
    movePlayer(key, false);
  });
};
