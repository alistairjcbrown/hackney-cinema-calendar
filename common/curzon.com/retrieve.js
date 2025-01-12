const ocapiv1Retrieve = require("../ocapi-v1/retrieve");

async function retrieve(attributes) {
  const mainPageResponse = await fetch(attributes.url);
  const mainPage = await mainPageResponse.text();
  const inititialiseData = JSON.parse(
    mainPage.match(/^\s+occInititialiseData:\s+({.+}),$/im)[1],
  );
  const workflowDataData = JSON.parse(
    mainPage.match(/^\s+workflowData:\s+({.+}),$/im)[1],
  );
  const { siteId: cinemaId } = workflowDataData.entityIds;
  return ocapiv1Retrieve({ ...attributes, cinemaId }, inititialiseData.api);
}

module.exports = retrieve;
