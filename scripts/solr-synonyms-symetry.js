/*
 * expect solr synonyms JSON file
 * should be compliant with solr API
 * the script 'extend' synonyms to make them symetric
 * A -> B becomes A -> [A,B]
 * A -> [Y, Z] becomes A -> [A,Y,Z] + Y -> [A,Y,Z] + Z -> [A,Y,Z]
 * in summary, the script duplicates the key and deals with cartesian combinations
 */

const fs = require('fs');
const R = require('ramda');
const chalk = require('chalk');

const inFile = 'synonyms.json';
const outFile = 'symetric-synonyms.json';

console.log(chalk.cyan(`symetry ${inFile} into ${outFile}`));
const data = JSON.parse(fs.readFileSync(inFile, "utf8"));

const json = R.pipe(
  R.toPairs,
  R.reduce(
    (acc, [key, values]) => {
      const allValues = R.prepend(key, values);
      R.forEach(value => acc[value] = allValues, allValues);
      return acc;
    },
    {},
  ),
)(data);

fs.writeFileSync(outFile, JSON.stringify(json));
