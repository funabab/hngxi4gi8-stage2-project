function isHeroku() {
  return 'DYNO' in process.env && process.env.PATH.indexOf('heroku') != -1
}


module.exports = { isHeroku }