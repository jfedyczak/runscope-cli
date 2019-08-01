import argh from 'argh'
import blessed from 'blessed'
import { promises } from 'fs'
import toml from 'toml'

import Bucket from './runscope/bucket'
import Runscope from './runscope/runscope'
import Test from './runscope/test'

const fs = promises

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

interface ITest {
	name: string
	result?: string
	ok?: boolean
	steps: number
	stepsComplete: number
}

interface IStatus {
	tests: ITest[]
}

const main = async (params: any) => {
	const dispScreen = blessed.screen({
		smartCSR: true,
		terminal: 'xterm-256color',
	})

	dispScreen.key(['escape', 'q', 'C-c'], (ch, key) => {
		return process.exit(0)
	})

	const dispTestList = blessed.box({
		parent: dispScreen,
		scrollable: true,
		top: 0,
		left: '0%',
		width: '100%',
		height: '100%',
		tags: true,
		style: {
			fg: 'green',
			bg: 'none',
		},
	})

	const dispHeader = blessed.text({
		parent: dispTestList,
		top: 0,
		left: 0,
		content: 'starting tests...',
		style: { fg: 'white' },
	})

	let dispTests: any[] = []

	const dispUpdateTests = (tests: ITest[]) => {
		dispTests.forEach(t => t.detach())
		const maxlen = tests.reduce(
			(acc, t) => (acc > t.name.length ? acc : t.name.length),
			0,
		)
		tests.forEach((test, i) => {
			let column = 1
			const row = i + 2
			dispTests.push(
				blessed.text({
					parent: dispTestList,
					top: row,
					left: column,
					content: `-`,
					style: {
						fg: 'white',
					},
				}),
			)
			column += 2

			dispTests.push(
				blessed.text({
					parent: dispTestList,
					top: row,
					left: column,
					content: test.name,
					style: {
						fg:
							typeof test.ok === 'boolean'
								? test.ok
									? 'green'
									: 'red'
								: 'white',
					},
				}),
			)
			column += maxlen + 2

			if (!test.result) {
				dispTests.push(
					blessed.text({
						parent: dispTestList,
						top: row,
						left: column,
						content: `${test.stepsComplete} / ${test.steps}`,
						style: {
							fg: 'grey',
						},
					}),
				)
			} else {
				dispTests.push(
					blessed.text({
						parent: dispTestList,
						top: row,
						left: column,
						content: test.result,
						style: {
							fg: 'white',
						},
					}),
				)
			}
		})
		dispScreen.render()
	}

	const results: IStatus = {
		tests: [],
	}
	// const results = {
	// 	tests: [{ name: '/v1/reports/ratings', steps: 9, stepsComplete: 2 }],
	// }

	dispUpdateTests(results.tests)

	// await delay(3600e3)
	const config = toml.parse(await fs.readFile('runscope.toml', 'utf8'))

	const runscope = new Runscope(config.general)

	if (!config.run) {
		const bucket = new Bucket(runscope)
		config.run = (await bucket.listTests()).map((test: any) => ({
			name: test.name,
		}))
	}

	await Promise.all(
		config.run.map(async (testSpec: any) => {
			const bucket = new Bucket(runscope, testSpec.bucket)

			const test = new Test(bucket, testSpec.name)

			const testRunId = await test.run()
			const result: ITest = {
				name: testSpec.name,
				steps: (await test.getDetails()).steps.length,
				stepsComplete: 0,
			}

			results.tests.push(result)

			results.tests.sort((a: ITest, b: ITest) =>
				a.name.localeCompare(b.name),
			)
			dispUpdateTests(results.tests)

			let status
			for (;;) {
				await delay(3e3)
				status = await test.status(testRunId)
				const doneRequests = status.requests.filter(
					(r: any) => r.result,
				).length

				result.stepsComplete = doneRequests

				dispUpdateTests(results.tests)

				if (
					status.result === 'pass' ||
					status.result === 'fail' ||
					status.result === 'cancelled'
				) {
					result.result = status.result
					result.ok = status.result === 'pass'
					// console.log(results)
					break
				}
			}
			dispUpdateTests(results.tests)
		}),
	)

	dispHeader.content = 'press q to quit'
	dispScreen.render()
}

main(argh.argv)
