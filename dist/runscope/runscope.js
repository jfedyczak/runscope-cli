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
const cache_1 = __importDefault(require("./../cache"));
const API_ENDPOINT = 'https://api.runscope.com';
const delay = (ms) => new Promise(r => setTimeout(r, ms));
class Runscope {
    constructor(config) {
        this.config = config;
        this.requestPromise = delay(100);
    }
    get defaultBucket() {
        if (!this.config.bucket) {
            throw new Error('No default bucket defined');
        }
        return this.config.bucket;
    }
    get defaultEnv() {
        if (!this.config.env) {
            throw new Error('No default env defined');
        }
        return this.config.env;
    }
    cache(key, worker) {
        return __awaiter(this, void 0, void 0, function* () {
            // this.cachePromise = this.cachePromise.then(async () =>
            return cache_1.default(`runscope:${key}`, worker);
            // )
            // return this.cachePromise
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache('buckets', () => __awaiter(this, void 0, void 0, function* () { return this.makeRequest('GET', '/buckets'); }));
        });
    }
    makeRequest(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequestUrl(method, `${API_ENDPOINT}${url}`, data);
        });
    }
    makeRequestUrl(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestPromise = this.requestPromise.then(() => __awaiter(this, void 0, void 0, function* () {
                // console.log(url)
                const result = yield request_promise_native_1.default({
                    uri: url,
                    method,
                    headers: {
                        Authorization: `Bearer ${this.config.key}`,
                    },
                    json: true,
                    formData: data,
                });
                if (result.error) {
                    // console.log('error')
                    // console.log(url)
                    throw new Error(result.error);
                }
                return result.data;
            }));
            return this.requestPromise;
        });
    }
}
exports.default = Runscope;
