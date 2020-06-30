
const AnonymousHome = require('../page/anonymous_home.js');
const assertType = require('../util/assert_type.js');

// Returns {urlVideoId, studioVideos}
//  urlVideoId: string id.
//  studioVideos: An instance of StudioVideos currently loaded in the tab.
module.exports = exports =
    async function(tab, username, password, title, description) {
  assertType.objects({tab});
  assertType.strings({username, password, title, description});

  await AnonymousHome.goto(tab);
  const anonHome = await AnonymousHome.New(tab);
  const personalHome = await anonHome.login(username, password);
  const yourVideos = await personalHome.goToYourVideos();
  return await yourVideos.uploadVideo({ title, description });
}
