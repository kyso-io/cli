#!/usr/bin/env node
const chalk = require('chalk')
const table = require('text-table')
const ms = require('ms')
const getCommandArgs = require('../src/command-args')
const { error, handleError } = require('../src/error')
const strlen = require('../src/strlen')
const exit = require('../src/utils/exit')
const Kyso = require('../src')


const help = async () => {
  console.log(
    `
  ${chalk.bold('kyso merge')}

  ${chalk.dim('Options:')}
    -h, --help              Output usage information

  To merge Jupyter notebooks you will need to first install 'nbdime'

    ${chalk.underline(`pip install nbdime`)}

  ${chalk.dim('To merge a fork:')}

    ${chalk.gray(`1.`)} ${chalk.cyan(`$ kyso merge pull ${chalk.underline(`username/forked-study#version-sha`)}`)}

      Pull the merge. This will create a .merge folder with the merge content.
      If the version-sha is not given, the latest will be pulled.

    ${chalk.gray(`2.`)} ${chalk.cyan(`$ kyso merge ls`)}

      This will list all the potential conflicts in the merge

    ${chalk.gray(`3.`)} ${chalk.cyan(`$ kyso merge diff notebook.ipynb`)} or ${chalk.cyan(`$ kyso merge diff-web notebook.ipynb`)}

      diff: Shows the diff of a file listed in the conflict list in the console
      diff-web: Shows the diff of the files in a web GUI

    ${chalk.gray(`4.`)} ${chalk.cyan(`$ kyso merge apply`)} or ${chalk.cyan(`$ kyso merge apply-web`)}

      This will do a 3-way merge of all files (including intelligent merging of Jupyter notebooks).
      You can keep using ${chalk.cyan(`$ kyso merge ls`)} to check for conflicts as you fix them.
      Use ${chalk.cyan(`$ kyso merge apply-web`)} to open up a web-gui for merging Jupyter notebooks.
`
  )
}

const pullMerge = async (kyso, args) => {
  if (args.length === 0) {
    error('Invalid number of arguments')
    return exit(1)
  }

  const name = String(args[0])

  const teamName = name.split('/')[0]
  let studyName = name.split('/')[1]
  let versionSha = null

  if (studyName.includes('#')) {
    versionSha = studyName.split('#')[1]
    studyName = studyName.split('#')[0]

    if (versionSha.length < 6) {
      const err = new Error(`Version id must have at least 6-digits.`)
      err.userError = true
      throw err
    }
  }

  const dest = process.cwd()
  const start_ = new Date()

  await kyso.pullMerge(studyName, teamName, dest, { versionSha })
  const elapsed_ = ms(new Date() - start_)
  console.log(`> Downloaded merge to .kyso/merge ${chalk.gray(`[${elapsed_}]`)}`)
  return true
}

const diff = async (kyso, args) => {
  if (args.length === 0) {
    error('Invalid number of arguments')
    return exit(1)
  }

  const name = String(args[0])
  await kyso.diff(name)
  return true
}

const diffWeb = async (kyso, args) => {
  if (args.length === 0) {
    error('Invalid number of arguments')
    return exit(1)
  }

  const name = String(args[0])
  await kyso.diffWeb(name)
  return true
}

const ls = async (kyso) => {
  const start_ = new Date()

  const dest = process.cwd()
  const conflicts = await kyso.lsConflicts(dest)
  const elapsed_ = ms(new Date() - start_)
  const header = [['', 'conflicted files'].map(s => chalk.dim(s))]
  let out = null
  if (conflicts && conflicts.length !== 0) {
    out = table(header.concat(
      conflicts.map(t => ['', `${t.name}`])
      ), {
        align: ['l', 'l', 'l', 'l', 'l', 'l'],
        hsep: ' '.repeat(2),
        stringLength: strlen
      }
    )
  }

  console.log(`> Merged ${chalk.gray(`[${elapsed_}]`)}`)
  if (out) { console.log(`\n${out}\n`) }
  return true
}


const applyMerge = async (kyso) => {
  const start_ = new Date()
  const conflicts = await kyso.applyMerge()
  const elapsed_ = ms(new Date() - start_)
  const header = [['', 'conflicted files'].map(s => chalk.dim(s))]
  let out = null
  if (conflicts && conflicts.length !== 0) {
    out = table(header.concat(
      conflicts.map(t => ['', `${t.name}`])
      ), {
        align: ['l', 'l', 'l', 'l', 'l', 'l'],
        hsep: ' '.repeat(2),
        stringLength: strlen
      }
    )
  }

  console.log(`> Applied merge ${chalk.gray(`[${elapsed_}]`)}`)
  if (out) { console.log(`\n${out}\n`) }
  return true
}


const applyMergeWeb = async (kyso) => {
  const start_ = new Date()
  const conflicts = await kyso.applyMergeWeb()
  const elapsed_ = ms(new Date() - start_)
  const header = [['', 'conflicted files'].map(s => chalk.dim(s))]
  let out = null
  if (conflicts && conflicts.length !== 0) {
    out = table(header.concat(
      conflicts.map(t => ['', `${t.name}`])
      ), {
        align: ['l', 'l', 'l', 'l', 'l', 'l'],
        hsep: ' '.repeat(2),
        stringLength: strlen
      }
    )
  }

  console.log(`> Applied merge ${chalk.gray(`[${elapsed_}]`)}`)
  if (out) { console.log(`\n${out}\n`) }
  return true
}


(async () => {
  try {
    const { args, argv, subcommand, token, apiUrl } = await getCommandArgs()

    if (argv.help || !subcommand) {
      help()
      return exit(0)
    }

    const kyso = new Kyso({
      url: apiUrl,
      token,
      debug: argv.debug,
      dir: process.cwd()
    })

    if (subcommand === 'ls' || subcommand === 'list') {
      return await ls(kyso, args)
    }

    if (subcommand === 'pull') {
      return await pullMerge(kyso, args)
    }

    if (subcommand === 'apply') {
      return await applyMerge(kyso)
    }

    if (subcommand === 'apply-web') {
      return await applyMergeWeb(kyso)
    }

    if (subcommand === 'diff') {
      return await diff(kyso, args)
    }

    if (subcommand === 'diff-web') {
      return await diffWeb(kyso, args)
    }


    return help()
  } catch (err) {
    return handleError(err)
  }
})()
