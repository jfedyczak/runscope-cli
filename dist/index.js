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
const fs_1 = require("fs");
const toml_1 = __importDefault(require("toml"));
const runscope_1 = __importDefault(require("./runscope"));
const fs = fs_1.promises;
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const main = (params) => __awaiter(this, void 0, void 0, function* () {
    const config = toml_1.default.parse(yield fs.readFile('runscope.toml', 'utf8'));
    const runscope = new runscope_1.default(config.general.key);
    if (config.run) {
        console.log(' -- running tests');
        for (const testSpec of config.run) {
            console.log(`   -- ${testSpec.name}`);
            const testRun = (yield runscope.runTest(config.general.bucket, testSpec.name, config.general.env)).runs[0];
            let status;
            for (;;) {
                status = yield runscope.testResultDetails(testRun);
                console.log(`   -- ${status.assertions_failed +
                    status.assertions_passed} / ${status.assertions_defined}`);
                if (status.result === 'pass' ||
                    status.result === 'fail' ||
                    status.result === 'cancelled') {
                    break;
                }
                yield delay(500);
            }
            console.log(`   -- ${status.result}`);
        }
    }
});
main(argh_1.default.argv);
