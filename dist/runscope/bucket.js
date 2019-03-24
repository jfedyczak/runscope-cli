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
class Bucket {
    constructor(runscope, bucketName) {
        this.runscope = runscope;
        this.bucketName = bucketName || runscope.defaultBucket;
    }
    get name() {
        return this.bucketName;
    }
    cache(key, worker) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runscope.cache(`bucket:${this.bucketName}:${key}`, worker);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache(this.bucketName, () => __awaiter(this, void 0, void 0, function* () {
                const buckets = yield this.runscope.listBuckets();
                const bucket = buckets.find(b => b.name === this.bucketName);
                return bucket;
            }));
        });
    }
    listTests() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache('tests', () => __awaiter(this, void 0, void 0, function* () {
                const list = yield this.makeRequest('GET', '/tests');
                return list;
            }));
        });
    }
    listSharedEnvs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache('sharedEnvs', () => __awaiter(this, void 0, void 0, function* () {
                const list = yield this.makeRequest('GET', '/environments');
                return list;
            }));
        });
    }
    makeRequest(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const bucketKey = (yield this.get()).key;
            return this.runscope.makeRequest(method, `/buckets/${bucketKey}${url}`, data);
        });
    }
}
exports.default = Bucket;
