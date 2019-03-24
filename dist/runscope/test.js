"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class Test {
    constructor(bucket, testName, envName) {
        this.bucket = bucket;
        this.testName = testName;
        this.envName = envName || bucket.runscope.defaultEnv;
    }
    get name() {
        return this.testName;
    }
    cache(key, worker) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bucket.cache(`test:${this.testName}:${this.envName}:${key}`, worker);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache(this.testName, () => __awaiter(this, void 0, void 0, function* () {
                const tests = yield this.bucket.listTests();
                const test = tests.find(t => t.name === this.name);
                return test;
            }));
        });
    }
    getDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest('GET', '');
        });
    }
    getEnv() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache(`${this.testName}:${this.envName}`, () => __awaiter(this, void 0, void 0, function* () {
                const envs = yield this.listEnvs();
                const env = envs.find(e => e.name === this.envName);
                return env;
            }));
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const [test, env] = yield Promise.all([this.get(), this.getEnv()]);
            const triggerURL = new url_1.URL(test.trigger_url);
            triggerURL.searchParams.append('runscope_environment', env.id);
            const testRun = yield this.bucket.runscope.makeRequestUrl('GET', triggerURL.href);
            return testRun.runs[0].test_run_id;
        });
    }
    status(testRunId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest('GET', `/results/${testRunId}`);
        });
    }
    listTestEnvs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache('envs', () => __awaiter(this, void 0, void 0, function* () {
                const list = yield this.makeRequest('GET', '/environments');
                return list;
            }));
        });
    }
    listEnvs() {
        return __awaiter(this, void 0, void 0, function* () {
            const [sharedEnvs, testEnvs] = yield Promise.all([
                this.bucket.listSharedEnvs(),
                this.listTestEnvs(),
            ]);
            return [...testEnvs, ...sharedEnvs];
        });
    }
    makeRequest(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const testKey = (yield this.get()).id;
            return this.bucket.makeRequest(method, `/tests/${testKey}${url}`, data);
        });
    }
}
exports.default = Test;
