#!/usr/bin/env node
const chalk = require('chalk')
const ms = require('ms')
const getCommandArgs = require('../src/command-args')
const { error, handleError } = require('../src/error')
const exit = require('../src/utils/exit')
const Kyso = require('../src')


const help = async () => {
  console.log(
    `
  ${chalk.bold('kyso versions')} <ls | create | rm> <versionname>

  ${chalk.dim('Options:')}
    -h, --help              Output usage information

  ${chalk.dim('Examples:')}

  ${chalk.gray('–')} Lists all your versions:
      ${chalk.cyan('$ kyso versions ls')}

  ${chalk.gray('–')} Creates a version:
      ${chalk.cyan(`$ kyso versions create ${chalk.underline('"a commit message"')}`)}

  ${chalk.gray('–')} Removing a version:
      ${chalk.cyan('$ kyso versions rm <version>')}
`
  )
}

const checkout = async (kyso, args) => {
  if (args.length === 0) {
    error('Invalid number of arguments')
    return exit(1)
  }

  const versionSha = String(args[0])
  const start_ = new Date()
  await kyso.checkout(versionSha)
  const elapsed_ = ms(new Date() - start_)
  console.log(`> Cloned study ${chalk.gray(`[${elapsed_}]`)}`)
  return true
}

(async () => {
  try {
    const { argv, args, subcommand, token, apiUrl } = await getCommandArgs()
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

    return await checkout(kyso, [subcommand].concat(args))
  } catch (err) {
    return handleError(err)
  }
})()