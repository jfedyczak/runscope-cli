import request from 'request-promise-native'
import cache from './../cache'

const API_ENDPOINT = 'https://api.runscope.com'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

interface Config {
	key: string
	bucket?: string
	env?: string
}

export default class Runscope {
	private config: Config

	private requestPromise: Promise<any>

	constructor(config: Config) {
		this.config = config

		this.requestPromise = delay(100)
	}

	get defaultBucket(): string {
		if (!this.config.bucket) {
			throw new Error('No default bucket defined')
		}
		return this.config.bucket
	}

	get defaultEnv(): string {
		if (!this.config.env) {
			throw new Error('No default env defined')
		}
		return this.config.env
	}

	public async cache(key: string, worker: () => Promise<any>) {
		// this.cachePromise = this.cachePromise.then(async () =>
		return cache(`runscope:${key}`, worker)
		// )
		// return this.cachePromise
	}

	public async listBuckets() {
		return this.cache('buckets', async () =>
			this.makeRequest('GET', '/buckets'),
		)
	}

	public async makeRequest(method: string, url: string, data?: any) {
		return this.makeRequestUrl(method, `${API_ENDPOINT}${url}`, data)
	}

	public async makeRequestUrl(method: string, url: string, data?: any) {
		this.requestPromise = this.requestPromise.then(async () => {
			// console.log(url)
			const result = await request({
				uri: url,
				method,
				headers: {
					Authorization: `Bearer ${this.config.key}`,
				},
				json: true,
				formData: data,
			})
			if (result.error) {
				// console.log('error')
				// console.log(url)
				throw new Error(result.error)
			}
			return result.data
		})
		return this.requestPromise
	}
}
