/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
const got = require('got');
const fs = require('fs');
const customSchemaJson = require('../src/custom-colour-schemes.json');
const private = require('../private.json');
const contrast = require('get-contrast');

const btoa = (str) => Buffer.from(str, 'binary').toString('base64');
const options = {
  headers: {
    'User-Agent': 'Windows Terminal Themes',
    Authorization: `Basic ${btoa(`atomcorp:${private.token}`)}`,
    Accept: 'application/vnd.github.v3.raw',
  },
};
const baseUrl =
  'https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/windowsterminal/';

// add boolean whether the theme is a light or dark
const assignColourType = (themes) => {
  return themes.map((theme) => {
    return {
      ...theme,
      isDark: contrast.ratio(theme.background, '#000') < 8,
    };
  });
};

const main = async () => {
  try {
    // get the list of scheme names in the git repo directory
    const dirResponse = await got(baseUrl, options);
    const files = JSON.parse(dirResponse.body);
    // use those names to download each of the scheme pages
    const fileResponses = await Promise.all(
      files.map((file) => got({...options, url: `${baseUrl}${file.name}`}))
    );
    // turn into the JSON
    const iTerm2SchemaJson = fileResponses.map((fileResponse) =>
      JSON.parse(fileResponse.body)
    );
    // merge with any themes that have been added in this project
    const combinedSchemaJson = assignColourType([
      ...iTerm2SchemaJson,
      ...customSchemaJson,
    ]).sort((a, b) => (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1));
    // write the new file
    fs.writeFileSync(
      './src/colour-schemes.json',
      JSON.stringify(combinedSchemaJson, null, 2)
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

main();
