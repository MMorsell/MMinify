import tl = require("azure-pipelines-task-lib/task");
const minify = require("@node-minify/core");
const gcc = require("@node-minify/google-closure-compiler");
var path = require("path"),
  fs = require("fs");

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @return {Array}               Result files with path string in an array
 */
function findFilesInDir(startPath: string, filter: string): string[] {
  var results: string[] = [];

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
    } else if (filename.indexOf(filter) >= 0) {
      console.log("-- found: ", filename);
      results.push(filename);
    }
  }
  return results;
}

/**
 *
 * @param {String[]} filePaths  The array of filePaths to all the files that will summarize to the total size in kilobytes
 */
function getTotalFileSizeInKiloBytes(filePaths: string[]): number {
  var totalFileSizeInBytes = 0;

  filePaths.forEach((filePath) => {
    totalFileSizeInBytes += getFilesizeInBytes(filePath);
  });
  return totalFileSizeInBytes / 1000;
}

/**
 *
 * @param {String} filename The filePath of the file that you want the size of in bytes
 */
function getFilesizeInBytes(filename: string): number {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

async function run() {
  try {
    const minifyFilesPath: string | undefined = tl.getInput("minifyFilesPath", true);
    if (minifyFilesPath == undefined || minifyFilesPath.trim() == "" || minifyFilesPath == "bad") {
      tl.setResult(tl.TaskResult.Failed, "minifyFilesPath is not valid");
      return;
    }
    const allFilePathsToMinify = findFilesInDir(minifyFilesPath, ".js");
    console.log(`Found ${allFilePathsToMinify.length} files to minify`);

    const preSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);
    console.log(`Pre-filesize: ${preSize} kilobytes`);

    await Promise.all(
      allFilePathsToMinify.map(async (filePathToMinify) => {
        await minify({ compressor: gcc, input: filePathToMinify, output: filePathToMinify, replaceInPlace: true });
      })
    );

    const postSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);

    console.log(`Minfied ${allFilePathsToMinify.length} number of files`);
    console.log(`Post-filesize: ${postSize} kilobytes`);

    console.log(`Total size saved: ${postSize - preSize} kilobytes`);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
