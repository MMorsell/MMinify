import tl = require("azure-pipelines-task-lib/task");
const minify = require("@node-minify/core");
const cleanCSS = require("@node-minify/clean-css");
const uglifyES = require("@node-minify/uglify-es");
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
    var filename: string = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter)); //recurse
    } else if (filename.endsWith(filter)) {
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
function getTotalFileSizeInKiloBytes(filePaths: string[]): number {
  var totalFileSizeInBytes = 0;

  filePaths.forEach((filePath) => {
    totalFileSizeInBytes += getFilesizeInBytes(filePath);
  });
  return totalFileSizeInBytes / 1000;
}

/**
 * Returns the file size in bytes
 * @param {String} filename The filePath of the file that you want the size of
 */
function getFilesizeInBytes(filename: string): number {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

/**
 * Minifies the given file extension (currently only supports .js and .css)
 * @param minifyFilesPath The parent path where the files is located, subfolders will be included in minification
 * @param fileType The type of file to minify (currently only supports .js and .css)
 */
async function minifyFileType(minifyFilesPath: string, fileType: string) {
  const allFilePathsToMinify = findFilesInDir(minifyFilesPath, fileType);
  console.log(`Found ${allFilePathsToMinify.length} ${fileType}-files to minify`);

  if (allFilePathsToMinify.length == 0) {
    return;
  }

  const preSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);
  console.log(`Pre-filesize: ${preSize} kilobytes`);
  var compressorType: any;

  if (fileType === ".js") {
    compressorType = uglifyES;
  } else if (fileType === ".css") {
    compressorType = cleanCSS;
  } else {
    tl.setResult(tl.TaskResult.Failed, `FileExtension ${fileType} is not supported!`);
    return;
  }

  await Promise.all(
    allFilePathsToMinify.map(async (filePathToMinify) => {
      await minify({ compressor: compressorType, input: filePathToMinify, output: filePathToMinify, replaceInPlace: true });
    })
  );

  const postSize = getTotalFileSizeInKiloBytes(allFilePathsToMinify);

  console.log(`Minfied ${allFilePathsToMinify.length} number of ${fileType}-files`);
  console.log(`Post-filesize: ${postSize} kilobytes`);

  console.log(`Total size saved: ${postSize - preSize} kilobytes`);
}

async function run() {
  try {
    const minifyFilesPath: string | undefined = tl.getInput("filePath", true);
    if (minifyFilesPath == undefined || minifyFilesPath.trim() == "" || minifyFilesPath == "bad") {
      tl.setResult(tl.TaskResult.Failed, "filePath is not valid");
      return;
    }

    var minifyJsFiles: boolean = tl.getBoolInput("minifyJsFiles", true);

    var minifyCSSFiles: boolean = tl.getBoolInput("minifyCssFiles", true);

    if (minifyJsFiles) {
      await minifyFileType(minifyFilesPath, ".js");
    }

    if (minifyCSSFiles) {
      await minifyFileType(minifyFilesPath, ".css");
    }

    if (!minifyJsFiles && !minifyCSSFiles) {
      console.log("Neither minify js nor css was checked, no minification has been executed");
    }
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
