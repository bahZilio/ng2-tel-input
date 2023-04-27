/**
 * @file gulp tasks to build the package
 * @author Gaurav Soni
 */

const { series, src, dest } = require('gulp');
const del = require('del')
const clean = require('gulp-clean');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute command via nodeJs.
 * Running command here so that we can run all commands from gulp file
 * @param {string} cmd any command that we can execute via terminal
 * @param {Object.<string, string>} options that needs to run along with cmd
 * @returns {Promise} if commnad runs successfully then resolve it else reject it
 */
const execCommand = (cmd, options) => {
    return new Promise((res, rej) => {
        exec(cmd, { ...options }, (error, stdout) => {
            if (error) {
                rej(error);
            }
            res(stdout);
        });

    })
};

/**
 * Compile the angular code to javascript
 * @param {Function} cb needs to execute at the end of the function 
 */
const compile = async () => {
    return execCommand('npm run build')
}

/**
 * copy assets to package 
 * @param {Function} cb needs to execute at the end of the function
 */
const copyAssets = () => {
    return src(['tmp/esm2015/*.d.ts', 'tmp/esm2015/*.json', 'package.json', 'README.md']).pipe(dest('dist/'));
};

/**
 * copy declarations(d.ts) files to package 
 * @param {Function} cb needs to execute at the end of the function
 */
const copySrcDeclarations = () => {
    return src('./tmp/esm2015/src/*.d.ts').pipe(dest('./dist/src/'));
};

/**
 * Run yarn pack command to create .tar file so that we can install package locally and test it
 * @param {Function} cb needs to execute at the end of the function
 */
const pack = async () => {
    try {
        await execCommand('yarn pack', { cwd: path.resolve(__dirname, 'dist') });
    } catch (error) {
        throw new Error('Error while creating tar file', error);
    }
};

/**
 * Remove dist folder
 * @param {Function} cb needs to execute at the end of the function
 */
const cleanDist = () => {
    return del('./dist')
};

/**
 * Remove tmp folder
 * @param {Function} cb needs to execute at the end of the function
 */
const cleanTmp = () => {
    return del('./tmp')
};

/**
 * Wrapp readFile function inside promise so that we can use promises
 * @param {string} path of the file
 */
const readFile = (path) => {
    return new Promise((res, rej) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                rej(err);
            }
            res(data);
        });
    });
};

/**
 * Update package.json to remove unnecessary fields
 * @param {Function} cb needs to execute at the end of the function
 */
const updatePackageJson = async (cb) => {
    const file = await readFile(path.resolve(`${__dirname}/dist`, 'package.json'));
    const packageFile = JSON.parse(file);
    packageFile.devDependencies = {};
    packageFile.scripts = {};
    packageFile.main = "./bundles/ng2-tel-input.umd.min.js";
    packageFile.module = "./esm5/ng2-tel-input.js";
    packageFile.es2015 = "./esm2015/ng2-tel-input.js";
    packageFile.typings = "./ng2-tel-input.d.ts";
    const data = JSON.stringify(packageFile, null, 2);
    fs.writeFileSync(path.resolve(`${__dirname}/dist`, 'package.json'), data);
    cb();
};

/**
 * Copy the public_api.ts file into the tmp directory 
 * @param {Function} cb The callback that needs to execute at the end of function
 */
const copyPublicApi = () => {
    return src(['./public_api.ts']).pipe(dest('./tmp/'));
};

/**
 * Copy the src into the tmp src directory 
 * @param {Function} cb The callback that needs to execute at the end of function
 */
const copySrcToTmp = () => {
    return src(['./src/**/*.ts']).pipe(dest('./tmp/src/'));
}

exports.buildDev = series(cleanTmp, cleanDist, copySrcToTmp, copyPublicApi, compile, copyAssets, copySrcDeclarations, updatePackageJson, cleanTmp, pack);
exports.default = series(cleanTmp, cleanDist, copySrcToTmp, copyPublicApi, compile, copyAssets, copySrcDeclarations, updatePackageJson, cleanTmp);
exports.tmp = series(cleanTmp, cleanDist, copySrcToTmp, copyPublicApi, compile, copyAssets, copySrcDeclarations, updatePackageJson);