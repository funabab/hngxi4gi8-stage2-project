const express = require('express')
const path = require('path')
const validator = require('validator').default
const { isHeroku } = require('./utils')
const { mailer } = require('./middlewares')

require('dotenv').config()

const app = express()

const PORT = process.env.PORT || 5000
const MODE = process.env.NODE_ENV || 'development'
const isDevelopment = MODE === 'development'

app.all('*', (req, res, next) => {
  if (
    !isDevelopment &&
    isHeroku() &&
    req.headers['x-forwarded-proto'] != 'https'
  ) {
    res.redirect('https://' + req.headers.host + req.url)
  } else {
    next()
  }
})

app.use(express.static('public'))
app.post(
  '/contact',
  express.json(),
  mailer('Abdullbassit Abdullahi'),
  (req, res) => {
    const { name, email, message } = req.body

    if (
      validator.isEmpty(name) ||
      validator.isEmpty(email) ||
      validator.isEmpty(message)
    ) {
      res.status(400).json({
        error: true,
        message: 'Missing required fields',
      })
    } else if (!validator.isEmail(email)) {
      res.status(400).json({
        error: true,
        message: 'Supplied email is invalid',
      })
    } else {
      res
        .mailer(email, name)
        .then(() => {
          res.json({
            message: `Acknoledement mail sent to ${email}, kindly check your inbox or spam`,
          })
        })
        .catch((error) => {
          console.error(error)
          res.status(500).json({
            error: true,
            message: 'A serve error occured',
          })
        })
    }
  }
)

app.all('*', (_, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'))
})

app.listen(PORT, () => {
  console.log(
    `Server Started on port ${PORT} -> MODE: ${MODE} -> http://127.0.0.1:${PORT}`
  )
})
