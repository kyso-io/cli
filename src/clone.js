const fs = require('fs-promise')
const https = require('https')
const path = require('path')
const pify = require('pify')
const mkdirp = require('mkdirp')
const _debug = require('./utils/output/debug')
const { fileMapHash } = require('./utils/hash')

const download = async (url, dest) => new Promise(async (resolve, reject) => { // eslint-disable-line
  await pify(mkdirp)(path.dirname(dest))
  const file = fs.createWriteStream(dest)
  https
    .get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve(dest); })
      .on('error', (err) => { fs.unlink(dest); reject(err); }) // eslint-disable-line
    })
})

module.exports = async (study, version, files, wd, { target = null, debug = false, throwExists = true } = {}) => { // eslint-disable-line
  const studyDir = path.join(wd, target || study.get('name'))
  try {
    await fs.stat(studyDir)
    if (throwExists) {
      const e = new Error(`Directory ${study.get('name')} already exists.`)
      e.userError = true
      throw e
    } else {
      return
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }

  const fileMap = version.get('fileMap')
  await pify(mkdirp)(studyDir)
  await Promise.all(files.map(async (file) => {
    const mapSha = fileMapHash(file.get('sha'), file.get('name'))
    const dest = path.join(studyDir, fileMap[mapSha])
    if (!file.get('file')) {
      return fs.writeFile(dest, '')
    }
    if (file.get('name') === 'study.json') {
      return fs.writeFile(dest, JSON.stringify(version.get('pkg'), null, 3))
    }

    _debug(debug, `Downloading ${file.get('name')} into ${dest}`)
    return download(file.get('file').url(), dest)
  }))
}