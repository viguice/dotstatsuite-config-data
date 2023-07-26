'use strict';

const fs = require('fs');
const chalk = require('chalk');
const shell = require('shelljs');
const Joi = require('joi');

const ENV_HOME = shell.pwd();
const directoryPath = `${ENV_HOME}/i18n`;

const schema = Joi.object();

console.log(chalk.cyan(`processing i18n files...`));
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log(chalk.red(`Unable to scan directory: ${err}`));
    process.exit(0);
  }
  files.forEach(file => {
    console.log(chalk.cyan(`processing ${file}...`));
    try {
      const translations = require(`${directoryPath}/${file}`);
      const { error } = schema.validate(translations);
      if (error) {
        console.log(chalk.red(`Unable to validate: ${file}`));
        console.log(chalk.red(error));
        process.exit(0);
      } else {
        console.log(chalk.green(`${file} is valid`));
      }
    } catch(error) {
      console.log(chalk.red(`Unable to load: ${file}`));
      console.log(chalk.red(error));
      process.exit(0);
    }
  });
});
