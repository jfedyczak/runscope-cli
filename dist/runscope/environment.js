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
class Environment {
    constructor(test, envName) {
        this.test = test;
        this.envName = envName || test.bucket.runscope.defaultEnv;
    }
    cache(key, worker) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.test.cache(`env:${key}`, worker);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache(this.envName, () => __awaiter(this, void 0, void 0, function* () {
                const envs = yield this.test.listEnvs();
                const env = envs.find(e => e.name === this.envName);
                return env;
            }));
        });
    }
    makeRequest(method, url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const envKey = (yield this.get()).key;
            return this.test.makeRequest(method, `/environments${envKey}${url}`, data);
        });
    }
}
exports.default = Environment;
