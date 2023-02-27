/*
 * convert oecd solr synonyms txt file in JSON
 */

const fs = require('fs');
const R = require('ramda');
const chalk = require('chalk');

const inFile = 'synonyms.txt';
const outFile = 'synonyms.json';

console.log(chalk.cyan(`converting ${inFile} into ${outFile}`));
const data = fs.readFileSync(inFile, 'utf-8');

const json = R.pipe(
  R.split(/\r?\n/),
  R.reduce(
    (acc, line) => {
      const [key, ...values] = R.split(',', line);
      return R.assoc(key, values, acc);
    },
    {},
  ),
)(data);

fs.writeFileSync(outFile, JSON.stringify(json));
