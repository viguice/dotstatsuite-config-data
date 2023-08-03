// 'use strict';

const R = require('ramda');
const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');

const args = process.argv.slice(3);
const milestone = R.nth(0)(args); //'dotstatsuiteJS@v12.0.0'
const token = R.nth(1)(args) //'glpat-xxxxxxxxxxxxx' // read access token
const _groupId = R.nth(2)(args);

if (R.isNil(milestone) || R.isEmpty(milestone)) {
  console.error(chalk.red('ERROR you have to enter a milestone'));
  process.exit(1);
}

if (R.isNil(token)) {
  console.error(chalk.red('ERROR you have to enter a gitlab token (at least api read access)'));
  process.exit(1);
}

if (R.isEmpty(token)) {
  console.log(chalk.yellow('Warning gitlab token is empty'));
}

const groupId = R.or(R.isEmpty(_groupId), R.isNil(_groupId)) ? '3863477' : _groupId;

const config = {
  headers: { Authorization: `Bearer ${token}` }
};

const endPoint = 'https://gitlab.com/api/v4';

const writeFile = (fileName = 'merge_requests', data) => {
  fs.writeFileSync(
    `${fileName}.json`,
    JSON.stringify(data, null, 2)
  );
}

const projectIds = {
  '10286911': 'dotstatsuite-kube-rp',
  '10315177': 'dotstatsuite-proxy',
  '10463880': 'dotstatsuite-d3-charts',
  '10481708': 'dotstatsuite-components',
  '10532325': 'dotstatsuite-data-explorer',
  '10537079': 'dotstatsuite-config',
  '10631000': 'dotstatsuite-share',
  '10648479': 'dotstatsuite-documentation',
  '10822973': 'dotstatsuite-data-lifecycle-manager',
  '12189645': 'dotstatsuite-data-viewer',
  '12478906': 'dotstatsuite-sdmxjs',
  '13360665': 'dotstatsuite-visions',
  '13875210': 'keycloak',
  '24721298': 'siscc-config-data',
  '26931893': 'dotstatsuite-config-data',
  '10283564': 'dotstatsuite-sdmx-faceted-search',
  '24290491': 'dotstatsuite-quality-assurance'
}

const getIssues = async (milestone, page = 1, data = []) => {
  const query = `${endPoint}/groups/${groupId}/issues/?milestone=${milestone}&page=${page}`;
  const response = await axios.get(query, config);

  const nextPage = response.headers['x-next-page'];
  const issues = R.map(issue => ({
    iid: issue.iid,
    project_id: issue.project_id,
    web_url: issue.web_url,
    state: issue.state,
  }), response.data)

  if (nextPage) {
    return R.concat(await getIssues(milestone, nextPage, issues), data);
  }
  return R.concat(issues, data);
}

getIssues(milestone).then((issues) => {
  const relatedMRurls = R.map(issue => {
    if (issue.state === 'closed') return;
    const query = `${endPoint}/projects/${issue.project_id}/issues/${issue.iid}/related_merge_requests`;
    return axios.get(query, config);
  }, issues);
  Promise.all(R.reject(R.isNil)(relatedMRurls)).then((data) => {
    const mrs = R.reduce((acc, relatedMRS) => {
      const mr = R.map(mr => ({
        project_id: R.defaultTo(mr.project_id, projectIds[mr.project_id]),
        web_url: mr.web_url,
      }), relatedMRS.data);
      return R.concat(mr, acc);
    }, [], data);

    // groupes by project_id
    writeFile(
      `merge_requests`,
      R.pipe(
        R.groupBy(R.prop('project_id')),
        R.mapObjIndexed((repository) => [...new Set(R.map(R.prop('web_url'))(repository))])
      )(mrs)
    );
  });
});

// nombre de tickets
// nombre de MRs
// by name of repository;
