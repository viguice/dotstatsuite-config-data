// 'use strict';

const fs = require('fs');
const chalk = require('chalk');
const R = require('ramda');
const shell = require('shelljs');

const envPath = shell.pwd();
const ENV_HOME = envPath;
const CHANGELOG_FOLDER = process.env.CHANGELOG_FOLDER || ENV_HOME;
const ENV_URL = 'https://gitlab.com/sis-cc/.stat-suite/dotstatsuite-config-data';
const ENV_LANG = process.env.ENV_LANG || 'en';
const CHANGE_LOG_NAME = process.env.CHANGE_LOG_NAME || 'changelog-i18n';

const args = process.argv.slice(2);
const branch1 = R.nth(0)(args);
const branch2 = R.nth(1)(args);

if (R.isNil(branch1) || R.isNil(branch2)) {
  console.log(chalk.red('ERROR you have to provide two branchs or commits to compare'));
  process.exit(1);
}
const branchs = [branch1, branch2]

const generatedFolder = (branch) => `geni18n-${branch}-translations`;

R.forEach((branch) => {
  const folderName = generatedFolder(branch)
  const path = `${ENV_HOME}/${folderName}`
  if (shell.exec(`git clone ${ENV_URL} ${path}`).code !== 0) {
    console.log(chalk.red(`Error: git clone ${ENV_URL} failed`));
    shell.rm('-rf', path);
    console.log(chalk.cyan(`   INFO rm generated folder ${path}`));
    process.exit(1);
  }
  shell.cd(path);
  if (shell.exec(`git checkout ${branch}`).code !== 0) {
    console.log(chalk.red(`Error: git checkout ${branch} failed`));
    shell.rm('-rf', path);
    console.log(chalk.cyan(`   INFO rm generated folder ${path}`));
    process.exit(1);
  }
  shell.cp(`${path}/i18n/${ENV_LANG}.json`, `${CHANGELOG_FOLDER}/${branch}.json`);
}, branchs)

const getKeys = filename => R.keys(JSON.parse(fs.readFileSync(filename, "utf8")));
const newKeys = getKeys(`${CHANGELOG_FOLDER}/${R.head(branchs)}.json`, "utf8");
const oldKeys = getKeys(`${CHANGELOG_FOLDER}/${R.last(branchs)}.json`, "utf8");

console.log(`difference from ${branch1} to ${branch2}`)
fs.writeFileSync(
  `${CHANGELOG_FOLDER}/${CHANGE_LOG_NAME}.json`,
  JSON.stringify({
    "New keys": R.difference(newKeys, oldKeys),
    "Removed keys": R.difference(oldKeys, newKeys)
  }, null, 2)
);

shell.cd()

R.forEach((branch) => {
  const folderName = generatedFolder(branch)
  const path = `${ENV_HOME}/${folderName}`
  shell.rm('-rf', path);
  shell.rm('-rf', `${CHANGELOG_FOLDER}/${branch}.json`);
  console.log(chalk.cyan(`   INFO rm generated folder ${path}`));
}, branchs)