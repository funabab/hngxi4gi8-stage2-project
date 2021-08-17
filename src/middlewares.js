const axios = require('axios').default

function mailer(name) {
  return (_, res, next) => {
    const { MAILJET_PUBLIC_KEY, MAILJET_PRIVATE_KEY, MAILJET_SENDER_EMAIL } =
      process.env
    if (!MAILJET_PUBLIC_KEY || !MAILJET_PRIVATE_KEY || !MAILJET_SENDER_EMAIL) {
      res.status(500).json({
        error: true,
        message: 'A server error occured',
      })
    } else {
      res.mailer = (senderEmail, senderName) => {
        return axios.post(
          'https://api.mailjet.com/v3.1/send',
          {
            Messages: [
              {
                From: {
                  Email: MAILJET_SENDER_EMAIL,
                  Name: name,
                },
                To: [
                  {
                    Email: senderEmail,
                    Name: senderName,
                  },
                ],
                Subject: 'Acknoledgement Mail',
                Textpart: `This is an acknoledment mail to ${senderEmail}, sent from ${name} contact form\n\nThis is part of HNGxi4Gi8 Intership Program`,
              },
            ],
          },
          {
            auth: {
              username: MAILJET_PUBLIC_KEY,
              password: MAILJET_PRIVATE_KEY,
            },
          }
        )
      }
      next()
    }
  }
}

module.exports = { mailer }
