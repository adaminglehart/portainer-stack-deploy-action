import * as core from '@actions/core'
import axios from 'axios'
import { deployStack } from './deployStack'

export async function run(): Promise<void> {
  try {
    const portainerHost: string = core.getInput('portainer-host', {
      required: true
    })
    const username: string = core.getInput('username', {
      required: true
    })
    const password: string = core.getInput('password', {
      required: true
    })
    const endpointId: string = core.getInput('endpoint-id', {
      required: false
    })
    const stackName: string = core.getInput('stack-name', {
      required: true
    })
    const dockerComposeFile: string = core.getInput('docker-compose-file', {
      required: true
    })
    const templateVariables: string = core.getInput('template-variables', {
      required: false
    })
    const gitCredentialId: number = parseInt(
      core.getInput('git-credential-id', {
        required: true
      })
    )
    const pruneStack: boolean = core.getBooleanInput('prune-stack', {
      required: false
    })
    const pullImage: boolean = core.getBooleanInput('pull-image', {
      required: false
    })

    await deployStack({
      portainerHost,
      username,
      password,
      endpointId: parseInt(endpointId) || 1,
      stackName,
      dockerComposeFile,
      gitCredentialId,
      templateVariables: templateVariables ? JSON.parse(templateVariables) : undefined,
      pruneStack: pruneStack || false,
      pullImage: pullImage || false
    })
    core.info('✅ Deployment done')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const {
        status,
        data,
        config: { url, method }
      } = error.response
      return core.setFailed(
        `AxiosError HTTP Status ${status} (${method} ${url}): ${JSON.stringify(data, null, 2)}`
      )
    }
    return core.setFailed(error as Error)
  }
}

run()
