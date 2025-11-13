import React, { useRef, useEffect, useState } from "react";

const DinoGame = () => {
  const canvasRef = useRef(null);
  const obstacles = useRef([]);
  const frameCount = useRef(0);
  const speed = useRef(6);
  const wingFlap = useRef(0);

  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const dino = useRef({
    x: 50,
    y: 0,
    width: 44,
    height: 47,
    velocityY: 0,
    jumping: false,
  });

  const groundY = 150;
  const gravity = 1;
  const jumpStrength = 18;

  const drawDino = (ctx, dino) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(dino.x, groundY - dino.height - dino.y, dino.width, dino.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(dino.x + 30, groundY - dino.height - dino.y + 10, 6, 6);
  };

  const drawCactus = (ctx, obs) => {
    ctx.fillStyle = "#228B22";
    ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height);
  };

  const drawPterodactyl = (ctx, obs) => {
    ctx.fillStyle = "#555";
    let wingOffset = wingFlap.current < 15 ? 5 : 0;
    wingFlap.current = (wingFlap.current + 1) % 30;
    ctx.fillRect(obs.x, groundY - obs.y - obs.height, obs.width, obs.height * 0.6);
    ctx.fillRect(obs.x - wingOffset, groundY - obs.y - obs.height + 5, obs.width + wingOffset, 5);
    ctx.fillRect(obs.x, groundY - obs.y - obs.height + 15, obs.width + wingOffset, 5);
  };

  const dinoBottom = (d) => groundY - d.height - d.y;
  const obstacleTop = (obs) =>
    obs.type === "ptero" ? groundY - obs.y - obs.height : groundY - obs.height;

  const handleJump = () => {
    if (!dino.current.jumping) {
      dino.current.velocityY = jumpStrength;
      dino.current.jumping = true;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 200;

    const checkCollision = (d, o) => {
      return (
        d.x < o.x + o.width &&
        d.x + d.width > o.x &&
        dinoBottom(d) < obstacleTop(o) + o.height &&
        dinoBottom(d) + d.height > obstacleTop(o)
      );
    };

    const onKeyDown = (e) => {
      if ((e.key === " " || e.key === "ArrowUp") && !isGameOver) {
        handleJump();
      }
      if (e.key === "Enter" && isGameOver) {
        resetGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    let animationFrameId;
    let lastObstacleFrame = 0;

    const resetGame = () => {
      setIsGameOver(false);
      obstacles.current = [];
      frameCount.current = 0;
      speed.current = 6;
      setScore(0);
      dino.current.y = 0;
      dino.current.velocityY = 0;
      dino.current.jumping = false;
      wingFlap.current = 0;
      lastObstacleFrame = 0;
      loop();
    };

    const loop = () => {
      animationFrameId = requestAnimationFrame(loop);
      frameCount.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ground line
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Dino jump animation
      if (dino.current.jumping) {
        dino.current.y += dino.current.velocityY;
        dino.current.velocityY -= gravity;

        if (dino.current.y <= 0) {
          dino.current.y = 0;
          dino.current.jumping = false;
          dino.current.velocityY = 0;
        }
      }
      drawDino(ctx, dino.current);

      // Closer and more frequent obstacles with random spacing
      if (frameCount.current - lastObstacleFrame >= 50) {
        const framesSinceLast = frameCount.current - lastObstacleFrame;
        if (framesSinceLast >= 75 || Math.random() < 0.1) {
          const type = Math.random() < 0.8 ? "cactus" : "ptero";
          obstacles.current.push({
            type,
            x: canvas.width,
            width: type === "cactus" ? 20 + Math.random() * 15 : 40,
            height: type === "cactus" ? 40 + Math.random() * 20 : 20,
            y: type === "ptero" ? 50 + Math.random() * 50 : 0,
          });
          lastObstacleFrame = frameCount.current;
        }
      }

      obstacles.current.forEach((obs, index) => {
        let obsSpeed = speed.current;
        if (obs.type === "ptero") obsSpeed *= 1.3;

        obs.x -= obsSpeed;

        if (obs.type === "cactus") drawCactus(ctx, obs);
        else drawPterodactyl(ctx, obs);

        if (checkCollision(dino.current, obs)) {
          setIsGameOver(true);
          cancelAnimationFrame(animationFrameId);
        }

        if (obs.x + obs.width < 0) {
          obstacles.current.splice(index, 1);
          setScore((prev) => prev + 1);
        }
      });

      if (speed.current < 14) speed.current += 0.002;

      if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "30px 'Press Start 2P', cursive";
        ctx.fillText("GAME OVER", canvas.width / 2 - 90, canvas.height / 2 - 10);
        ctx.font = "18px 'Press Start 2P', cursive";
        ctx.fillText("Press Enter to Restart", canvas.width / 2 - 110, canvas.height / 2 + 30);
      }
    };

    loop();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameOver]);

  return (
    <div style={{ textAlign: "center", marginTop: 30, userSelect: "none" }}>
      <h1>Google Dino Runner Clone</h1>
      <canvas
        ref={canvasRef}
        style={{
          border: "3px solid #444",
          borderRadius: "10px",
          backgroundColor: "#f7f7f7",
          display: "block",
          margin: "0 auto",
        }}
      />
      <p style={{ marginTop: 15, fontFamily: "'Press Start 2P', cursive", fontSize: 20 }}>
        Score: {score}
      </p>
      <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 16 }}>
       Press Space or ↑ to leap — stay sharp, the cacti are coming fast!
      </p>
    </div>
  );
};

export default DinoGame;
