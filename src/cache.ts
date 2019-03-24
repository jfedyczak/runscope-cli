const CACHE = new Map()

export default async function cache(key: string, worker: () => Promise<any>) {
	if (!CACHE.has(key)) {
		CACHE.set(key, worker())
	}
	return CACHE.get(key)
}
