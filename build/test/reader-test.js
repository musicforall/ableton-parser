"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = __importDefault(require("chai"));
var chai_as_promised_1 = __importDefault(require("chai-as-promised"));
var reader_1 = require("../lib/reader/reader");
var utils_1 = require("../lib/reader/utils");
var xml_1 = require("../lib/reader/xml");
var fs_extra_1 = require("fs-extra");
var path_1 = __importDefault(require("path"));
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.should();
var expect = chai_1.default.expect;
// Test resource directory
var resDir = "./test/res";
// Tmp directory created as an exact copy of the res directory before test
var tmpDir = "./test/tmp";
// Sample file relative path to res dir
var sampleAls = "sample-project/sample-project.als";
var sampleXml = "sample-project/sample-project.xml";
var invalid_file = "invalid-file";
describe('Reader', function () {
    describe('Load Reader', function () {
        // TODO: Put proper analytics to check how slow?
        this.slow(100);
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // Create a copy of the sample files.
                            // This is important as the parser modifies the origional file.
                            fs_extra_1.copySync(resDir, tmpDir);
                            _a = this;
                            return [4 /*yield*/, xml_1.loadXml(path_1.default.join(tmpDir, sampleXml))];
                        case 1:
                            _a.expected_xml = _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('When the valid gzipped als is given', function (done) {
            var reader = new reader_1.Reader(path_1.default.join(tmpDir, sampleAls));
            // eql is used instead of equal as the objects are not directly comparable
            reader.load().should.eventually.eql(this.expected_xml).notify(done);
        });
        it('When the invalid file type is given', function (done) {
            var reader = new reader_1.Reader(path_1.default.join(tmpDir, invalid_file));
            reader.load().should.eventually.rejectedWith(reader_1.INVALID_FILE).notify(done);
        });
        it('When the valid extracted(xml) als is given', function (done) {
            var test_als = utils_1.changeExt(path_1.default.join(tmpDir, sampleXml), '.als');
            fs_extra_1.copySync(path_1.default.join(tmpDir, sampleXml), test_als);
            var reader = new reader_1.Reader(test_als);
            reader.load().should.eventually.eql(this.expected_xml).notify(done);
        });
        after(function () {
            // Cleanup after test
            fs_extra_1.remove(tmpDir);
        });
    });
});
