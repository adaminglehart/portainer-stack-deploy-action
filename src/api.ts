import axios from 'axios'
import * as core from '@actions/core'

type EnvVariables = Array<{
  name: string
  value: string
}>

type EndpointId = number

type StackData = {
  Id: number
  Name: string
  EndpointId: EndpointId
  Env: EnvVariables
}

type CreateStackParams = { endpointId: EndpointId }
type CreateStackBody = {
  name: string
  composeFile: string
  repositoryGitCredentialID: number
  repositoryURL: string
}
type UpdateStackParams = { endpointId: EndpointId }
type UpdateStackBody = {
  env: EnvVariables
  composeFile: string
  repositoryGitCredentialID: number
  repositoryURL: string
}

export class PortainerApi {
  private axiosInstance

  constructor(host: string) {
    this.axiosInstance = axios.create({
      baseURL: `${host}/api`
    })
  }

  async login({ username, password }: { username: string; password: string }): Promise<void> {
    const { data } = await this.axiosInstance.post<{ jwt: string }>('/auth', {
      username,
      password
    })
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout', null, { timeout: 5000 })
    } catch (error) {
      core.info(`Logout failed: ${error}`)
    }
    this.axiosInstance.defaults.headers.common['Authorization'] = ''
  }

  async getStacks(): Promise<StackData[]> {
    const { data } = await this.axiosInstance.get<StackData[]>('/stacks')
    return data
  }

  async createStack(params: CreateStackParams, body: CreateStackBody): Promise<void> {
    await this.axiosInstance.post(
      '/stacks/create/standalone/repository',
      { ...body, repositoryAuthentication: true },
      { params }
    )
  }

  async updateStack(id: number, params: UpdateStackParams, body: UpdateStackBody): Promise<void> {
    await this.axiosInstance.put(
      `/stacks/${id}/git/redeploy`,
      { ...body, repositoryAuthentication: true },
      { params }
    )
  }
}
