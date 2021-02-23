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
Object.defineProperty(exports, "__esModule", { value: true });
var tl = require("azure-pipelines-task-lib/task");
var minify = require("@node-minify/core");
var cleanCSS = require("@node-minify/clean-css");
var uglifyES = require("@node-minify/uglify-es");
var path = require("path"), fs = require("fs");
/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @return {Array}               Result files with path string in an array
 */
function findFilesInDir(startPath, filter) {
    var results = [];
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return results;
    }
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(findFilesInDir(filename, filter)); //recurse
        }
        else if (filename.endsWith(filter)) {
            //   console.log("-- found: ", filename);
            results.push(filename);
        }
    }
    return results;
}
/**
 * Returns the total size in kilobytes of all files in the string[]
 * @param {String[]} filePaths  The array of filePaths to all the files that will summarize to the total size
 */
function getTotalFileSizeInKiloBytes(filePaths) {
    var totalFileSizeInBytes = 0;
    filePaths.forEach(function (filePath) {
        totalFileSizeInBytes += getFilesizeInBytes(filePath);
    });
    return totalFileSizeInBytes / 1000;
}
/**
 * Returns the file size in bytes
 * @param {String} filename The filePath of the file that you want the size of
 */
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}
/**
 * Minifies the given file extension (currently only supports .js and .css)
 * @param minifyFilesPath The parent path where the files is located, subfolders will be included in minification
 * @param fileType The type of file to minify (currently only supports .js and .css)
 */
function minifyFileType(minifyFilesPath, fileType) {
    return __awaiter(this, void 0, void 0, function () {
        var allFilePathsToMinify, preSize, compressorType, postSize;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allFilePathsToMinify = findFilesInDir(minifyFilesPath, fileType);
                    console.log("Found " + allFilePathsToMinify.length + " " + fileType + "-files to minify");
                    if (allFilePathsToMinify.length == 0) {
                        return [2 /*return*/];
                    }
                    preSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);
                    console.log("Pre-filesize: " + preSize + " kilobytes");
                    if (fileType === ".js") {
                        compressorType = uglifyES;
                    }
                    else if (fileType === ".css") {
                        compressorType = cleanCSS;
                    }
                    else {
                        tl.setResult(tl.TaskResult.Failed, "FileExtension " + fileType + " is not supported!");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.all(allFilePathsToMinify.map(function (filePathToMinify) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, minify({ compressor: compressorType, input: filePathToMinify, output: filePathToMinify, replaceInPlace: true })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    postSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);
                    console.log("Minfied " + allFilePathsToMinify.length + " number of " + fileType + "-files");
                    console.log("Post-filesize: " + postSize + " kilobytes");
                    console.log("Total size saved: " + (postSize - preSize) + " kilobytes");
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var minifyFilesPath, minifyJsFiles, minifyCSSFiles, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    minifyFilesPath = tl.getInput("filePath", true);
                    if (minifyFilesPath == undefined || minifyFilesPath.trim() == "" || minifyFilesPath == "bad") {
                        tl.setResult(tl.TaskResult.Failed, "filePath is not valid");
                        return [2 /*return*/];
                    }
                    minifyJsFiles = tl.getBoolInput("minifyJsFiles", true);
                    minifyCSSFiles = tl.getBoolInput("minifyCssFiles", true);
                    if (!minifyJsFiles) return [3 /*break*/, 2];
                    return [4 /*yield*/, minifyFileType(minifyFilesPath, ".js")];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!minifyCSSFiles) return [3 /*break*/, 4];
                    return [4 /*yield*/, minifyFileType(minifyFilesPath, ".css")];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (!minifyJsFiles && !minifyCSSFiles) {
                        console.log("Neither minify js nor css was checked, no minification has been executed");
                    }
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
run();
