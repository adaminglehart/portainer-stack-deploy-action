import { PortainerApi } from './api'
import * as core from '@actions/core'
import * as github from '@actions/github'

type DeployStack = {
  portainerHost: string
  username: string
  password: string
  endpointId: number
  stackName: string
  dockerComposeFile: string
  gitCredentialId: number
  templateVariables?: object
  pruneStack?: boolean
  pullImage?: boolean
}

export async function deployStack({
  portainerHost,
  username,
  password,
  endpointId,
  stackName,
  dockerComposeFile,
  gitCredentialId
}: // pruneStack,
// pullImage
DeployStack): Promise<void> {
  const portainerApi = new PortainerApi(portainerHost)

  core.info('Logging in to Portainer instance...')
  await portainerApi.login({
    username,
    password
  })

  try {
    const allStacks = await portainerApi.getStacks()
    const existingStack = allStacks.find(s => s.Name === stackName)

    const repositoryURL = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}`

    if (existingStack) {
      core.info(`Found existing stack with name: ${stackName}`)
      core.info('Updating existing stack...')
      await portainerApi.updateStack(
        existingStack.Id,
        {
          endpointId: existingStack.EndpointId
        },
        {
          env: existingStack.Env,
          composeFile: dockerComposeFile,
          repositoryURL,
          repositoryGitCredentialID: gitCredentialId
        }
      )
      core.info('Successfully updated existing stack')
    } else {
      core.info('Deploying new stack from repo ' + repositoryURL + ' : ' + dockerComposeFile)
      await portainerApi.createStack(
        {
          endpointId
        },
        {
          name: stackName,
          composeFile: dockerComposeFile,
          repositoryURL,
          repositoryGitCredentialID: gitCredentialId
        }
      )
      core.info(`Successfully created new stack with name: ${stackName}`)
    }
  } catch (error) {
    core.info('⛔️ Something went wrong during deployment!')
    core.info((error as Error).message)
    core.info((error as Error).name)
    core.info((error as Error).stack ?? '')
    throw error
  } finally {
    core.info(`Logging out from Portainer instance...`)
    await portainerApi.logout()
  }
}
