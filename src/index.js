const path = require('path')
const Parse = require('parse/node')
const secrets = require('./secrets')
const studyJSON = require('./get-metadata')
const makeTemplate = require('./study-template')
const cfg = require('../src/cfg')
const fs = require('fs-promise')

Parse.initialize(secrets.PARSE_APP_ID)
Parse.serverURL = secrets.PARSE_SERVER_URL

const Study = Parse.Object.extend('Study')
const Team = Parse.Object.extend('Team')
const Invite = Parse.Object.extend('Invite')

module.exports = class Invites {
  constructor(url, token, dir = process.cwd()) {
    this._url = url
    this._token = token
    this.dir = dir
  }

  async createStudy(name) {
    let userOrTeam = null
    let studyName = name

    if (name.includes('/')) {
      userOrTeam = name.split('/')[0]
      studyName = name.split('/')[1]
    }

    const { hasStudyJson } = await studyJSON.read(this.dir)
    if (hasStudyJson) {
      console.log('A study.json already exists.')
      return false
    }

    const query = new Parse.Query(Study)
    query.equalTo('name', studyName)
    const count = await query.count({ sessionToken: this._token })
    if (count !== 0) {
      const error = new Error(`You already have a study called ${studyName}`)
      error.userError = true
      throw error
    }

    const template = await makeTemplate({
      name: studyName,
      author: cfg.read().nickname
    })

    await fs.writeFile(path.join(this.dir, 'study.json'), template)
    return true
  }

  async lsStudies() {
    const query = new Parse.Query(Study)
    const studies = await query.find({ sessionToken: this._token })
    return studies
  }

  async rmStudy(study) {
    return study.destroy({ sessionToken: this._token })
  }


  async createTeam(name) {
    const team = new Team()
    team.set('name', name)

    return team.save(null, { sessionToken: this._token })
  }

  async lsTeams() {
    const query = new Parse.Query(Team)
    const teams = await query.find({ sessionToken: this._token })
    return teams
  }

  async rmTeam(team) {
    return team.destroy({ sessionToken: this._token })
  }


  async createInvite(targetEmail, teamName) {
    const invite = new Invite()
    invite.set('targetEmail', targetEmail)
    invite.set('targetTeam', teamName)
    return invite.save(null, { sessionToken: this._token })
  }

  async lsInvites() {
    const query = new Parse.Query(Invite)
    const invites = await query.find({ sessionToken: this._token })
    await Promise.all(
      invites.map((invite) => invite.get('team').fetch({ sessionToken: this._token }))
    )
    return invites
  }

  async rmInvite(invite) {
    return invite.destroy({ sessionToken: this._token })
  }

  async addTag(tag) {
    const { hasStudyJson, studyConfig } = await studyJSON.read(this.dir)

    if (!hasStudyJson) {
      const error = new Error('No study.json, cannot list tags.')
      error.userError = true
      throw error
    }

    const _tags = studyConfig.tags || []
    if (_tags.includes(tag)) {
      const error = new Error('Tag already exists.')
      error.userError = true
      throw error
    }

    _tags.push(tag)
    const tags = _tags
      .filter((val, index, array) => array.indexOf(val) === index)
    await studyJSON.merge(this.dir, { tags })
    return true
  }

  async lsTags() {
    const { hasStudyJson, studyConfig } = await studyJSON.read(this.dir)

    if (!hasStudyJson) {
      const error = new Error('No study.json, cannot list tags.')
      error.userError = true
      throw error
    }

    return studyConfig.tags || []
  }

  async rmTag(tag) {
    const { hasStudyJson, studyConfig } = await studyJSON.read(this.dir)

    if (!hasStudyJson) {
      const error = new Error('No study.json, cannot list tags.')
      error.userError = true
      throw error
    }

    const _tags = studyConfig.tags || []
    if (!_tags.includes(tag)) {
      const error = new Error('Tag doesn\'t exists.')
      error.userError = true
      throw error
    }

    const tags = _tags
      .filter((val, index, array) => array.indexOf(val) === index)
      .filter(val => val !== tag)

    await studyJSON.merge(this.dir, { tags })
    return true
  }

}
