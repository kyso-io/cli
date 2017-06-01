#!/usr/bin/env node
const chalk = require('chalk')
const getCommandArgs = require('../src/command-args')
const { error, handleError } = require('../src/error')
const Kyso = require('../src')
const Docker = require('../src/docker')
const exit = require('../src/utils/exit')

const help = async () => {
  console.log(
    `
  ${chalk.bold('kyso tags')} <run|init>

  ${chalk.dim('Options:')}
    -h, --help              Output usage information
    -d, --debug             Debug mode [off]

  ${chalk.dim('Examples:')}

  ${chalk.gray('–')} Run the Docker Container (builds if needed):
      ${chalk.cyan('$ kyso docker run')}
        ${chalk.dim(`If no Dockerfile exists, it will run the kyso-jupyter
        image and open a Jupyter notebook in the current directory`)}

  ${chalk.gray('–')} Initialize a Dockerfile in the current directory:
      ${chalk.cyan('$ kyso docker init')}
        ${chalk.dim(`You can either extend the created Dockerfile, or
        define your own`)}
`
  )
}

const run = async (docker) => docker.run()

const init = async (docker) => docker.init()

const open = async (docker) => {} // eslint-disable-line

const install = async (docker, args) => {} // eslint-disable-line

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

    const docker = new Docker(kyso)

    if (subcommand === 'start' || subcommand === 'run') {
      return await run(docker, args)
    }

    if (subcommand === 'init') {
      return await init(docker, args)
    }

    if (subcommand === 'open') {
      return await open(docker, args)
    }

    if (subcommand === 'pip install') {
      return await install(docker, args)
    }

    error('Please specify a valid subcommand: ls | add | rm | help')
    return help()
  } catch (err) {
    return handleError(err)
  }
})()
