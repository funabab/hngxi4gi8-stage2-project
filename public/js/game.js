window.startGame = (function () {
  const elCanvas = document.getElementById('game-canvas')
  const context = elCanvas.getContext('2d')
  const width = 800,
    height = 800,
    entities = []
  let lastTime = performance.now(),
    delta = 0,
    gameStart = false
  window.sfx = ['hit', 'score'].map((item) => {
    const audio = new Audio()
    audio.src = 'audios/' + item + '.wav'
    return audio
  })

  class Paddle {
    constructor(x, y, bound) {
      this.paddleWidth = 50
      this.paddleHeight = 10
      this.bound = bound - this.paddleWidth
      this.moveSpeed = 150
      this.moveDir = 0

      this.x = x - this.paddleWidth / 2
      this.y = y - this.paddleHeight / 2
    }

    getPaddleCollider() {
      return this
    }

    update(delta) {
      this.x = Math.max(
        0,
        Math.min(this.x + this.moveSpeed * this.moveDir * delta, this.bound)
      )
    }

    render(context) {
      context.fillStyle = 'white'
      context.fillRect(this.x, this.y, this.paddleWidth, this.paddleHeight)
    }
  }

  class Ball extends EventTarget {
    constructor(x, y, radius, boundX, boundY) {
      super()
      this.radius = radius
      this.initialX = this.x = x
      this.initialY = this.y = y
      this.moveSpeedX = 100
      this.moveSpeedY = 100
      this.boundX = boundX
      this.boundY = boundY
      this.lastCollide = null
      this.randomDir()
    }

    randomDir(side) {
      if (typeof side == 'undefined') side = Math.round(Math.random())
      this.side = side

      this.moveDir =
        Math.PI * 0.6 * Math.random() -
        Math.PI * 0.2 +
        (side == 1 ? 0 : Math.PI)
    }

    reSpawn() {
      this.x = this.initialX
      this.y = this.initialY
      this.moveSpeedX = 100
      this.moveSpeedY = 100
      this.lastCollide = null
      this.randomDir()
      this.dispatchEvent(new Event('respawn'))
    }

    update(delta, entities) {
      this.x += Math.sin(this.moveDir) * this.moveSpeedX * delta
      this.y += Math.cos(this.moveDir) * this.moveSpeedY * delta
      this.checkBounds(entities)
    }

    ballLoss(entities) {
      entities.forEach((entity) => {
        if (typeof entity.getPaddleCollider == 'function') {
          if (entity.side != this.side) {
            entity.score += 1
          }
        }
      })
      window.sfx[1].play()
    }

    checkBounds(entities) {
      if (this.x < this.radius) {
        this.x = this.radius
        this.moveSpeedX *= -1
      } else if (this.x > this.boundX - this.radius * 2) {
        this.x = this.boundX - this.radius * 2
        this.moveSpeedX *= -1
      } else if (this.y < -this.radius * 2) {
        this.ballLoss(entities)
        this.reSpawn()
      } else if (this.y > this.boundY + this.radius * 2) {
        this.ballLoss(entities)
        this.reSpawn()
      }
    }

    checkCollision(entities) {
      entities.forEach((entity) => {
        if (typeof entity.getPaddleCollider == 'function') {
          const col = entity.getPaddleCollider()
          if (
            this.lastCollide != col &&
            this.x > col.x - this.radius &&
            this.x < col.x + col.paddleWidth + this.radius &&
            this.y > col.y - this.radius &&
            this.y < col.y + col.paddleHeight + this.radius
          ) {
            this.lastCollide = col
            this.moveSpeedX = Math.max(
              100,
              Math.min(350, this.moveSpeedX * Math.random() * 2)
            )
            this.moveSpeedY = Math.max(
              100,
              Math.min(350, this.moveSpeedY * Math.random() * 2)
            )
            this.randomDir(col.y >= this.boundY / 2 ? 0 : 1)
            this.dispatchEvent(new CustomEvent('collide', { details: col }))
            window.sfx[0].play()
          }
        }
      })
    }

    render(context) {
      context.fillStyle = 'white'
      context.beginPath()
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      context.fill()
    }
  }

  class CPUController {
    constructor(balls, paddle, side) {
      this.balls = balls
      this.paddle = paddle
      this.side = side
      this.score = 0
      this.checkSide()

      this.balls.forEach((ball) => {
        ball.addEventListener('respawn', this.checkSide.bind(this))
        ball.addEventListener('collide', this.checkSide.bind(this))
      })
    }

    distTo(ball, paddle) {
      const x = ball.x - this.paddle.x
      const y = ball.y - this.paddle.y
      return Math.sqrt(x * x + y * y)
    }

    checkSide() {
      this.canMove = this.balls.reduce(
        (check, ball) => check || ball.side == this.side,
        false
      )
    }

    getPaddleCollider() {
      return this.paddle
    }

    update(delta) {
      const ball = this.balls
        .filter((ball) => ball.side == this.side)
        .sort((ballA, ballB) => this.distTo(ballA) - this.distTo(ballB))[0]

      if (this.canMove) {
        this.paddle.moveDir = ball.x < this.paddle.x ? -1 : 1
      } else {
        this.paddle.moveDir = 0
      }
      this.paddle.update(delta)
    }

    render(context) {
      this.paddle.render(context)
    }
  }

  class PlayerController {
    constructor(paddle, bound, side) {
      this.paddle = paddle
      this.bound = bound
      this.score = 0
      this.side = side

      document.body.addEventListener('touchstart', this.handleInput.bind(this))
      document.body.addEventListener('touchmove', this.handleInput.bind(this))
      document.body.addEventListener(
        'touchend',
        this.handleInput.bind(this, null)
      )

      document.body.addEventListener('keydown', (e) => {
        if (e.code == 'ArrowLeft' || e.code == 'KeyW') this.paddle.moveDir = -1
        else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
          this.paddle.moveDir = 1
        } else {
          this.paddle.moveDir = 0
        }
      })

      document.body.addEventListener('keyup', () => (this.paddle.moveDir = 0))
    }

    handleInput(e) {
      const event = e instanceof TouchEvent ? e.changedTouches[0] : e
      if (event) this.paddle.moveDir = event.clientX >= this.bound ? 1 : -1
      else this.paddle.moveDir = 0
    }

    getPaddleCollider() {
      return this.paddle
    }

    update(delta) {
      this.paddle.update(delta)
    }

    render(context) {
      this.paddle.render(context)
    }
  }

  function render() {
    delta = gameStart ? (performance.now() - lastTime) / 1000 : 0
    lastTime = performance.now()

    // animation loop
    requestAnimationFrame(render)
    context.clearRect(0, 0, width, height)
    // draw outer border
    context.strokeStyle = 'white'
    context.lineWidth = 2
    context.strokeRect(0, 0, width, height)

    context.setLineDash([10, 10])
    context.beginPath()
    context.moveTo(0, height / 2)
    context.lineTo(width, height / 2)
    context.stroke()

    const fontSize = 50
    context.fillStyle = '#d1d1d1'
    context.font = `${fontSize}px poxel-font`
    let size = context.measureText('CPU: ' + playerCPU.score)

    context.fillText(
      'CPU: ' + playerCPU.score,
      (width - size.width) * 0.5,
      height * 0.25 - fontSize * 0.5
    )

    size = context.measureText('YOU: ' + player.score)
    context.fillText(
      'YOU: ' + player.score,
      (width - size.width) * 0.5,
      height * 0.75 + fontSize * 0.5
    )

    entities.forEach((entity) => {
      entity.update(delta, entities)
      if (typeof entity.checkCollision == 'function')
        entity.checkCollision(entities)
      if (typeof entity.render == 'function') entity.render(context)
    })
  }

  const paddle1 = new Paddle(width / 2, height * 0.95, width),
    paddle2 = new Paddle(width * 0.5, height * 0.05, width),
    ball1 = new Ball(width * 0.5, height * 0.5, 10, width, height),
    playerCPU = new CPUController([ball1], paddle2, 0),
    player = new PlayerController(paddle1, width / 2, 1)

  entities.push(player, playerCPU, ball1)

  render()
  return () => {
    document.querySelector('#audio-music').play()
    document.getElementById('game-instruction').style.opacity = '0'
    gameStart = true
  }
})()
