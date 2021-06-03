'use strict';

const fs = require('fs');
const glob = require('glob');
const chalk = require('chalk');
const R = require('ramda');
const shell = require('shelljs');

const ROOT_PATH = process.env.ROOT_PATH || 'keys';
const ENV_PATH = process.env.ENV_PATH || '../dotstatsuite-config-data/i18n';
const GIT_BRANCH = process.env.GIT_BRANCH || 'develop';
const ALLOWED_APP_IDS = ['data-explorer', 'data-lifecycle-manager', 'data-viewer'];

const args = process.argv.slice(3);
if (R.isEmpty(args)) {
  console.log(chalk.red('Missing arguments \n yarn i18n:update [app] [branch]'));
  process.exit(1);
}

const appId = R.head(args);
if (! R.includes(appId, ALLOWED_APP_IDS)) {
  console.log(chalk.red('ERROR allowed app ids are', ALLOWED_APP_IDS));
  process.exit(1);
}
const branchName = R.head(args.slice(1));
if (R.isNil(branchName)) {
  console.log(chalk.red('ERROR you should provide the name of your branch you wish update'));
  process.exit(1);
}

shell.mkdir('-p', ROOT_PATH);
const generatedPath = (app, branch = GIT_BRANCH) => `../geni18n-${branch}-${app}`;

R.forEach((app) => {
  const path = generatedPath(app)
  if (shell.exec(`git clone -b ${GIT_BRANCH} https://gitlab.com/sis-cc/.stat-suite/dotstatsuite-${app}.git ${path}`).code !== 0) {
    console.log(chalk.red(`Error: Git clone ${app} failed`));
    shell.exec(`rm -rf ${path}`);
    console.log(chalk.cyan(`   INFO rm generated folder ${path}`));
    process.exit(1);
  }
  shell.cp(`${path}/keys.json`, `${ROOT_PATH}/${app}.json`);

  shell.exec(`rm -rf ${path}`);
  console.log(chalk.cyan(`   INFO rm generated folder ${path}`));
}, ALLOWED_APP_IDS)

const featurePath = generatedPath(appId, branchName)
if (shell.exec(`git clone -b ${branchName} https://gitlab.com/sis-cc/.stat-suite/dotstatsuite-${appId}.git ${featurePath}`).code !== 0) {  
  console.log(chalk.red(`Error: Git clone ${appId} failed`));
  shell.exec(`rm -rf ${featurePath}`);
  console.log(chalk.cyan(`   INFO rm generated folder ${featurePath}`));
  process.exit(1);
}

const oldKeysPath = `${ROOT_PATH}/${appId}.json`;
const newKeysPath = process.env.KEYS_PATH || `${featurePath}/keys.json`;

try {
  if (fs.existsSync(newKeysPath)) {
    // update keys of the current app
    console.log(chalk.cyan(`   INFO Update keys ${newKeysPath} --> ${oldKeysPath}`));
    fs.writeFileSync(`${ROOT_PATH}/${appId}.json`, fs.readFileSync(newKeysPath, 'utf8'));

    // merge all keys of all apps in default
    const apps = glob.sync(`${ROOT_PATH}/*.json`);
    const allKeys = R.toPairs(
      apps.map(path => {
        return JSON.parse(fs.readFileSync(path, "utf8"));
      }).reduce((memo, keys) => {
        return { ...memo, ...keys };
      }, {})
    );

    // update all locales with all keys
    const locales = glob.sync(`${ENV_PATH}/*.json`);
    locales.map(path => {
      const oldKeys = JSON.parse(fs.readFileSync(path, "utf8"));
      const newKeys = R.reduce(
        (memo, [ key, defaultMessage ]) => {
          return { ...memo, [key]: oldKeys[key] || defaultMessage };
        },
        {},
        allKeys,
      );

      fs.writeFileSync(path, JSON.stringify(newKeys, null, 2));
    });

    shell.exec(`rm -rf ${featurePath}`);
    console.log(chalk.cyan(`   INFO rm generated folder ${featurePath}`));
    shell.exec(`rm -rf ${ROOT_PATH}`);
    console.log(chalk.cyan(`   INFO rm generated folder ${ROOT_PATH}`));
    console.log(chalk.green(`SUCCESS ${locales.length} locales updated with ${allKeys.length} keys`));
  } else {
    console.log(chalk.red('ERROR path to new keys is invalid', newKeysPath));
    process.exit(1);
  }
} catch(err) {
  console.error(err);
  process.exit(1);
}
