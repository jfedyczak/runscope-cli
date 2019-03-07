import argh from 'argh'
import { promises } from 'fs'
import toml from 'toml'

import Runscope from './runscope'
import { runInContext } from 'vm'

const fs = promises

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const main = async (params: any) => {
	const config = toml.parse(await fs.readFile('runscope.toml', 'utf8'))

	const runscope = new Runscope(config.general.key)

	if (config.run) {
		console.log(' -- running tests')
		for (const testSpec of config.run) {
			console.log(`   -- ${testSpec.name}`)
			const testRun = (await runscope.runTest(
				config.general.bucket,
				testSpec.name,
				config.general.env,
			)).runs[0]
			let status
			for (;;) {
				status = await runscope.testResultDetails(testRun)
				console.log(
					`   -- ${status.assertions_failed +
						status.assertions_passed} / ${
						status.assertions_defined
					}`,
				)
				if (
					status.result === 'pass' ||
					status.result === 'fail' ||
					status.result === 'cancelled'
				) {
					break
				}
				await delay(500)
			}
			console.log(`   -- ${status.result}`)
		}
	}
}

main(argh.argv)
