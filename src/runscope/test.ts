import Bucket from './bucket'
import { URL } from 'url'

export default class Test {
	public bucket: Bucket
	private testName: string
	private envName: string

	constructor(bucket: Bucket, testName: string, envName?: string) {
		this.bucket = bucket
		this.testName = testName
		this.envName = envName || bucket.runscope.defaultEnv
	}

	get name() {
		return this.testName
	}

	public async cache(key: string, worker: () => Promise<any>) {
		return this.bucket.cache(
			`test:${this.testName}:${this.envName}:${key}`,
			worker,
		)
	}

	public async get() {
		return this.cache(this.testName, async () => {
			const tests: any[] = await this.bucket.listTests()
			const test = tests.find(t => t.name === this.name)
			return test
		})
	}

	public async getDetails() {
		return this.makeRequest('GET', '')
	}

	public async getEnv() {
		return this.cache(`${this.testName}:${this.envName}`, async () => {
			const envs: any[] = await this.listEnvs()
			const env = envs.find(e => e.name === this.envName)
			return env
		})
	}

	public async run() {
		const [test, env] = await Promise.all([this.get(), this.getEnv()])
		const triggerURL = new URL(test.trigger_url)
		triggerURL.searchParams.append('runscope_environment', env.id)
		const testRun = await this.bucket.runscope.makeRequestUrl(
			'GET',
			triggerURL.href,
		)
		return testRun.runs[0].test_run_id
	}

	public async status(testRunId: string) {
		return this.makeRequest('GET', `/results/${testRunId}`)
	}

	public async listTestEnvs() {
		return this.cache('envs', async () => {
			const list = await this.makeRequest('GET', '/environments')
			return list
		})
	}

	public async listEnvs() {
		const [sharedEnvs, testEnvs] = await Promise.all([
			this.bucket.listSharedEnvs(),
			this.listTestEnvs(),
		])
		return [...testEnvs, ...sharedEnvs]
	}

	public async makeRequest(method: string, url: string, data?: any) {
		const testKey: string = (await this.get()).id
		return this.bucket.makeRequest(method, `/tests/${testKey}${url}`, data)
	}
}
