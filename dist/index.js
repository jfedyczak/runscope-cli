"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const argh_1 = __importDefault(require("argh"));
const blessed_1 = __importDefault(require("blessed"));
const fs_1 = require("fs");
const toml_1 = __importDefault(require("toml"));
const bucket_1 = __importDefault(require("./runscope/bucket"));
const runscope_1 = __importDefault(require("./runscope/runscope"));
const test_1 = __importDefault(require("./runscope/test"));
const fs = fs_1.promises;
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const main = (params) => __awaiter(this, void 0, void 0, function* () {
    const dispScreen = blessed_1.default.screen({
        smartCSR: true,
        terminal: 'xterm-256color',
    });
    dispScreen.key(['escape', 'q', 'C-c'], (ch, key) => {
        return process.exit(0);
    });
    const dispTestList = blessed_1.default.box({
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
    });
    const dispHeader = blessed_1.default.text({
        parent: dispTestList,
        top: 0,
        left: 0,
        content: 'starting tests...',
        style: { fg: 'white' },
    });
    let dispTests = [];
    const dispUpdateTests = (tests) => {
        dispTests.forEach(t => t.detach());
        const maxlen = tests.reduce((acc, t) => (acc > t.name.length ? acc : t.name.length), 0);
        tests.forEach((test, i) => {
            let column = 1;
            const row = i + 2;
            dispTests.push(blessed_1.default.text({
                parent: dispTestList,
                top: row,
                left: column,
                content: `-`,
                style: {
                    fg: 'white',
                },
            }));
            column += 2;
            dispTests.push(blessed_1.default.text({
                parent: dispTestList,
                top: row,
                left: column,
                content: test.name,
                style: {
                    fg: typeof test.ok === 'boolean'
                        ? test.ok
                            ? 'green'
                            : 'red'
                        : 'white',
                },
            }));
            column += maxlen + 2;
            if (!test.result) {
                dispTests.push(blessed_1.default.text({
                    parent: dispTestList,
                    top: row,
                    left: column,
                    content: `${test.stepsComplete} / ${test.steps}`,
                    style: {
                        fg: 'grey',
                    },
                }));
            }
            else {
                dispTests.push(blessed_1.default.text({
                    parent: dispTestList,
                    top: row,
                    left: column,
                    content: test.result,
                    style: {
                        fg: 'white',
                    },
                }));
            }
        });
        dispScreen.render();
    };
    const results = {
        tests: [],
    };
    // const results = {
    // 	tests: [{ name: '/v1/reports/ratings', steps: 9, stepsComplete: 2 }],
    // }
    dispUpdateTests(results.tests);
    // await delay(3600e3)
    const config = toml_1.default.parse(yield fs.readFile('runscope.toml', 'utf8'));
    const runscope = new runscope_1.default(config.general);
    if (!config.run) {
        const bucket = new bucket_1.default(runscope);
        config.run = (yield bucket.listTests()).map((test) => ({
            name: test.name,
        }));
    }
    yield Promise.all(config.run.map((testSpec) => __awaiter(this, void 0, void 0, function* () {
        const bucket = new bucket_1.default(runscope, testSpec.bucket);
        const test = new test_1.default(bucket, testSpec.name);
        const testRunId = yield test.run();
        const result = {
            name: testSpec.name,
            steps: (yield test.getDetails()).steps.length,
            stepsComplete: 0,
        };
        results.tests.push(result);
        results.tests.sort((a, b) => a.name.localeCompare(b.name));
        dispUpdateTests(results.tests);
        let status;
        for (;;) {
            status = yield test.status(testRunId);
            const doneRequests = status.requests.filter((r) => r.result).length;
            result.stepsComplete = doneRequests;
            dispUpdateTests(results.tests);
            if (status.result === 'pass' ||
                status.result === 'fail' ||
                status.result === 'cancelled') {
                result.result = status.result;
                result.ok = status.result === 'pass';
                // console.log(results)
                break;
            }
            yield delay(100);
        }
        dispUpdateTests(results.tests);
    })));
    dispHeader.content = 'press q to quit';
    dispScreen.render();
});
main(argh_1.default.argv);
