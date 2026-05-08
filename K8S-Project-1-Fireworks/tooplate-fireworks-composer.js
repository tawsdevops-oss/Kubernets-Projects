const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particles = [];
let rockets = [];
let currentColor = '#FF5A6E';
let currentType = 'burst';
let autoShowInterval = null;

window.addEventListener('resize', () => {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
});

document.querySelectorAll('.color-option').forEach(option => {
   option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      currentColor = option.dataset.color;
   });
});

document.querySelectorAll('.type-btn').forEach(btn => {
   btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
   });
});

class Particle {
   constructor(x, y, color, type) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.type = type;
      this.life = 1;
      this.decay = Math.random() * 0.011 + 0.0037;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      switch (type) {
         case 'burst': this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; break;
         case 'ring': this.vx = Math.cos(angle) * 3; this.vy = Math.sin(angle) * 3; this.decay = 0.005; break;
         case 'willow': this.vx = Math.cos(angle) * speed * 0.5; this.vy = Math.sin(angle) * speed * 0.3; this.gravity = 0.15; break;
         case 'spiral': this.angle = angle; this.radius = 0; this.radiusSpeed = 3; this.angleSpeed = 0.1; break;
      }
      this.size = Math.random() * 1.5 + 1;
      this.sparkle = Math.random() * Math.PI * 2;
      this.sparkleSpeed = Math.random() * 0.1 + 0.05;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
      this.brightness = Math.random() * 0.3 + 0.7;
   }
   update() {
      if (this.type === 'spiral') {
         this.angle += this.angleSpeed;
         this.radius += this.radiusSpeed;
         this.x += Math.cos(this.angle) * this.radiusSpeed;
         this.y += Math.sin(this.angle) * this.radiusSpeed;
      } else {
         this.x += this.vx; this.y += this.vy;
         if (this.type === 'willow') this.vy += this.gravity; else this.vy += 0.05;
      }
      this.life -= this.decay;
      this.size *= 0.985;
      this.sparkle += this.sparkleSpeed;
      this.rotation += this.rotationSpeed;
   }
   draw() {
      const twinkle = Math.sin(this.sparkle) * 0.5 + 0.5;
      const currentSize = this.size * (0.8 + twinkle * 0.4);
      let alpha = this.life > 0.25 ? Math.min(1, (1 - this.life) / 0.25 + 0.3) * this.brightness : (this.life / 0.25) * this.brightness;
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentSize * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, currentSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.fillRect(-currentSize, -currentSize * 0.2, currentSize * 2, currentSize * 0.4);
      ctx.fillRect(-currentSize * 0.2, -currentSize, currentSize * 0.4, currentSize * 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
   }
}

class Rocket {
   constructor(targetX, targetY, color, type) {
      this.x = targetX; this.y = canvas.height;
      this.targetX = targetX; this.targetY = targetY;
      this.color = color; this.type = type;
      const duration = 40;
      this.vx = (targetX - this.x) / duration;
      this.vy = (targetY - this.y) / duration;
      this.life = 1;
      this.trail = [];
   }
   update() {
      this.trail.push({x: this.x, y: this.y});
      if (this.trail.length > 25) this.trail.shift();
      this.x += this.vx; this.y += this.vy;
      if (Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)) < 5) {
         this.life = 0;
         createFireworkExplosion(this.x, this.y, this.type);
      }
   }
   draw() {
      if (this.trail.length > 1) {
         for (let i = 0; i < this.trail.length - 1; i++) {
            ctx.globalAlpha = (i / this.trail.length) * 0.22;
            ctx.strokeStyle = currentColor;
            ctx.beginPath(); ctx.moveTo(this.trail[i].x, this.trail[i].y); ctx.lineTo(this.trail[i+1].x, this.trail[i+1].y); ctx.stroke();
         }
      }
      ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); ctx.fill();
   }
}

function createFireworkExplosion(x, y, type) {
   const particleCount = type === 'ring' ? 16 : type === 'spiral' ? 12 : 32;
   const colors = ['#FF5A6E', '#FFD700', '#3FE0A0', '#B377FF', '#FFFEF7'];
   for (let i = 0; i < particleCount; i++) {
      const particleColor = Math.random() < 0.5 ? currentColor : colors[Math.floor(Math.random() * colors.length)];
      particles.push(new Particle(x, y, particleColor, type));
   }
}

function createFirework(x, y) { rockets.push(new Rocket(x, y, currentColor, currentType)); }

canvas.addEventListener('click', (e) => { createFirework(e.clientX, e.clientY); });

const launchFirework = () => {
   const x = Math.random() * canvas.width;
   const y = Math.random() * canvas.height * 0.6 + 50;
   const colors = ['#FF5A6E', '#FFD700', '#3FE0A0', '#B377FF', '#FFFEF7'];
   const types = ['burst', 'ring', 'willow', 'spiral'];
   rockets.push(new Rocket(x, y, colors[Math.floor(Math.random() * colors.length)], types[Math.floor(Math.random() * types.length)]));
};

document.getElementById('autoShow').addEventListener('click', function () {
   if (autoShowInterval) {
      clearInterval(autoShowInterval); autoShowInterval = null;
      this.classList.remove('playing'); this.querySelector('.button-text').textContent = 'Play';
   } else {
      this.classList.add('playing'); this.querySelector('.button-text').textContent = 'Stop';
      autoShowInterval = setInterval(launchFirework, 600);
   }
});

document.getElementById('toggleUI').addEventListener('click', () => { document.body.classList.toggle('hide-ui'); });
document.getElementById('fullscreenBtn').addEventListener('click', () => {
   if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen();
});

function animate() {
   ctx.fillStyle = 'rgba(10, 10, 15, 0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
   for (let i = rockets.length - 1; i >= 0; i--) {
      rockets[i].update(); if (rockets[i].life <= 0) rockets.splice(i, 1); else rockets[i].draw();
   }
   for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1); else particles[i].draw();
   }
   if (particles.length > 2000) particles = particles.slice(-1500);
   requestAnimationFrame(animate);
}
animate();
setTimeout(() => { document.querySelector('.instructions').style.display = 'none'; }, 4000);
