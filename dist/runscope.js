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
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const url_1 = require("url");
const API_ENDPOINT = 'https://api.runscope.com';
const CACHE = new Map();
const cache = (key, worker) => __awaiter(this, void 0, void 0, function* () {
    if (!CACHE.has(key)) {
        CACHE.set(key, yield worker());
    }
    return CACHE.get(key);
});
class Runscope {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    findEnv(bucketName, testName, envName) {
        return __awaiter(this, void 0, void 0, function* () {
            const bucket = yield this.findBucket(bucketName);
            const test = yield this.findTest(bucketName, testName);
            const envs = yield this.testEnvs(bucket.key, test.id);
            const env = envs.find(e => e.name === envName);
            return env;
        });
    }
    testResultDetails(testRun) {
        return __awaiter(this, void 0, void 0, function* () {
            const details = yield this.makeRequest('GET', `/buckets/${testRun.bucket_key}/tests/${testRun.test_id}/results/${testRun.test_run_id}`);
            return details;
        });
    }
    runTest(bucketName, testName, envName) {
        return __awaiter(this, void 0, void 0, function* () {
            const test = yield this.findTest(bucketName, testName);
            const env = yield this.findEnv(bucketName, testName, envName);
            const triggerURL = new url_1.URL(test.trigger_url);
            triggerURL.searchParams.append('runscope_environment', env.id);
            const testRun = yield this.makeRequestUrl('GET', triggerURL.href);
            return testRun;
        });
    }
    findTest(bucketName, testName) {
        return __awaiter(this, void 0, void 0, function* () {
            return cache(`test:${bucketName}:${testName}`, () => __awaiter(this, void 0, void 0, function* () {
                const tests = yield this.listTests(bucketName);
                const test = tests.find(t => t.name === testName);
                return test;
            }));
        });
    }
    listTests(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const bucket = yield this.findBucket(bucketName);
            const tests = yield this.getTests(bucket.key);
            return tests;
        });
    }
    findBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return cache(`bucket:${name}`, () => __awaiter(this, void 0, void 0, function* () {
                const buckets = yield this.getBuckets();
                const bucket = buckets.find(b => b.name === name);
                return bucket;
            }));
        });
    }
    testEnvs(bucket, test) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest('GET', `/buckets/${bucket}/tests/${test}/environments`);
        });
    }
    getBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest('GET', '/buckets');
        });
    }
    getTests(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest('GET', `/buckets/${key}/tests`);
        });
    }
    makeRequest(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequestUrl(method, `${API_ENDPOINT}${url}`, data);
        });
    }
    makeRequestUrl(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(url)
            const result = yield request_promise_native_1.default({
                uri: url,
                method,
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                json: true,
                formData: data,
            });
            if (result.error) {
                console.log(url);
                throw new Error(result.error);
            }
            return result.data;
        });
    }
}
exports.default = Runscope;
