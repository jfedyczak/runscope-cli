import Runscope from './runscope'

export default class Bucket {
	public runscope: Runscope
	private bucketName: string

	constructor(runscope: Runscope, bucketName?: string) {
		this.runscope = runscope
		this.bucketName = bucketName || runscope.defaultBucket!
	}

	get name() {
		return this.bucketName
	}

	public async cache(key: string, worker: () => Promise<any>) {
		return this.runscope.cache(`bucket:${this.bucketName}:${key}`, worker)
	}

	public async get() {
		return this.cache(this.bucketName, async () => {
			const buckets: any[] = await this.runscope.listBuckets()
			const bucket = buckets.find(b => b.name === this.bucketName)
			return bucket
		})
	}

	public async listTests() {
		return this.cache('tests', async () => {
			const list = await this.makeRequest('GET', '/tests')
			return list
		})
	}

	public async listSharedEnvs() {
		return this.cache('sharedEnvs', async () => {
			const list = await this.makeRequest('GET', '/environments')
			return list
		})
	}

	public async makeRequest(method: string, url: string, data?: any) {
		const bucketKey: string = (await this.get()).key
		return this.runscope.makeRequest(
			method,
			`/buckets/${bucketKey}${url}`,
			data,
		)
	}
}
