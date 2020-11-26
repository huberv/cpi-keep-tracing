import {Command, flags} from '@oclif/command'
import {prompt} from 'enquirer'
import * as request from 'superagent'

interface Credentials {
  url: string;
  username: string;
  password: string;
}

async function throwIfNotOk(res: request.Response): Promise<request.Response> {
  if (!res.ok)
    throw new Error(`Failed with status ${res.status}`)
  return res
}

async function getIFlowIds({url, username, password}: Credentials): Promise<Array<string>> {
  return request
  .get(`${url}/itspaces/odata/api/v1/IntegrationRuntimeArtifacts?$format=json&$select=Id`)
  .auth(username, password)
  .then(throwIfNotOk)
  .then(res => res.body.d.results.map((result: any) => result.Id))
}

async function setLogLevelToTrace({url, username, password}: Credentials, filter: string | null) {
  const agent = request.agent() // to preserve cookies set by the CSRF token call
  const csrfToken = await agent
  .get(`${url}/itspaces/odata/api/v1/IntegrationRuntimeArtifacts?$format=json&$select=Id`)
  .auth(username, password)
  .withCredentials()
  .set('X-CSRF-Token', 'Fetch')
  .then(throwIfNotOk)
  .then(res => res.headers['x-csrf-token'])

  const iflowIds = await getIFlowIds({url, username, password}).then(ids => filter ? ids.filter(id => id.match(filter)) : ids)

  const resultPromises = iflowIds.map(id => {
    const body = {
      artifactSymbolicName: id,
      mplLogLevel: 'TRACE',
      nodeType: 'IFLMAP',
    }
    return agent.post(`${url}/itspaces/Operations/com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentSetMplLogLevelCommand`)
    .auth(username, password)
    .set('X-CSRF-Token', csrfToken)
    .send(body)
  })

  return Promise.all(resultPromises)
}

async function anyKeypress(message: string) {
  return prompt({type: 'input', name: 'doesntmatter', message})
}

function validateUrl(url: string): string | null {
  if (!url.startsWith('https://'))
    return 'The URL must start with >https://<'
  if (!url.endsWith('.com'))
    return 'The URL must end with >.com<'
  return null
}

class CpiKeepTracing extends Command {
  static description = 'Make iFlows running with log level TRACE'

  static flags = {
    username: flags.string({char: 'u', description: 'The (S-, C-, ...) username for basic authentication'}),
    url: flags.string({description: 'The tenant url in the format https://<some id>-tmn.hci.<some region>.hana.ondemand.com'}),
    password: flags.string({char: 'p', description: 'You (S-, C-, ...) user\'s password for basic authentication (not stored anywhere)'}),
    delay: flags.integer({char: 'd', default: 5 * 60, description: 'The delay between TRACE updates in seconds'}),
    filter: flags.string({char: 'f', description: 'Regular expression to filter affected iflows: Only matching iflows will be keept at TRACE'}),
  }

  async run() {
    const {flags} = this.parse(CpiKeepTracing)

    if (flags.url) {
      const error = validateUrl(flags.url)
      if (error) {
        console.error(error)
        process.exit(1)
      }
    }

    const questions: any[] = []

    if (!flags.url)
      questions.push(
        {
          type: 'input',
          name: 'url',
          message: 'Please enter the CPI url like https://<some id>-tmn.hci.<some region>.hana.ondemand.com',
          validate: input => {
            const error = validateUrl(input)
            return error ? error : true
          },
        })

    if (!flags.username)
      questions.push(
        {
          type: 'input',
          name: 'username',
          message: 'What is your username?',
        })

    if (!flags.password)
      questions.push(
        {
          type: 'password',
          name: 'password',
          message: 'What is your password (won\'t be stored anywhere)?',
        })

    const input = {...await prompt(questions), ...flags} as Credentials & {filter: string | null}

    await setLogLevelToTrace(input, input.filter)
    const intervalId = setInterval(() => setLogLevelToTrace(input, input.filter), flags.delay * 1000)

    await anyKeypress('Resetting log level to TRACE in the background. Press any key to abort.')
    clearInterval(intervalId)
    console.log('Bye, byue')
  }
}

export = CpiKeepTracing
