import request from 'request-promise-native'
import { URL } from 'url'

const API_ENDPOINT = 'https://api.runscope.com'

const CACHE = new Map()
const cache = async (key: string, worker: () => Promise<any>) => {
	if (!CACHE.has(key)) {
		CACHE.set(key, await worker())
	}
	return CACHE.get(key)
}

export default class Runscope {
	private apiKey: string

	constructor(apiKey: string) {
		this.apiKey = apiKey
	}

	public async findEnv(
		bucketName: string,
		testName: string,
		envName: string,
	) {
		const bucket = await this.findBucket(bucketName)
		const test = await this.findTest(bucketName, testName)
		const envs: any[] = await this.testEnvs(bucket.key, test.id)
		const env = envs.find(e => e.name === envName)
		return env
	}

	public async testResultDetails(testRun: any) {
		const details = await this.makeRequest(
			'GET',
			`/buckets/${testRun.bucket_key}/tests/${testRun.test_id}/results/${
				testRun.test_run_id
			}`,
		)
		return details
	}

	public async runTest(
		bucketName: string,
		testName: string,
		envName: string,
	) {
		const test = await this.findTest(bucketName, testName)
		const env = await this.findEnv(bucketName, testName, envName)
		const triggerURL = new URL(test.trigger_url)
		triggerURL.searchParams.append('runscope_environment', env.id)
		const testRun = await this.makeRequestUrl('GET', triggerURL.href)
		return testRun
	}

	public async findTest(bucketName: string, testName: string) {
		return cache(`test:${bucketName}:${testName}`, async () => {
			const tests: any[] = await this.listTests(bucketName)
			const test = tests.find(t => t.name === testName)
			return test
		})
	}

	public async listTests(bucketName: string) {
		const bucket = await this.findBucket(bucketName)
		const tests = await this.getTests(bucket.key)
		return tests
	}

	public async findBucket(name: string) {
		return cache(`bucket:${name}`, async () => {
			const buckets: any[] = await this.getBuckets()
			const bucket = buckets.find(b => b.name === name)
			return bucket
		})
	}

	private async testEnvs(bucket: string, test: string) {
		return this.makeRequest(
			'GET',
			`/buckets/${bucket}/tests/${test}/environments`,
		)
	}

	private async getBuckets() {
		return this.makeRequest('GET', '/buckets')
	}

	private async getTests(key: string) {
		return this.makeRequest('GET', `/buckets/${key}/tests`)
	}

	private async makeRequest(method: any, url: any, data?: any) {
		return this.makeRequestUrl(method, `${API_ENDPOINT}${url}`, data)
	}

	private async makeRequestUrl(method: string, url: string, data?: any) {
		// console.log(url)
		const result = await request({
			uri: url,
			method,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
			json: true,
			formData: data,
		})
		if (result.error) {
			console.log(url)
			throw new Error(result.error)
		}
		return result.data
	}
}
