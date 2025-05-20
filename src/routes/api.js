/* eslint-disable linebreak-style */
const { userRouter } = require('./user.router');
const { roleRouter } = require('./role.router');
const { bookmarkRouter } = require('./bookmark.router');
const { packageRouter } = require('./package.router');
const { postRouter } = require('./post.router');
const { reviewRouter } = require('./review.router');
const { statusRouter } = require('./status.router');
const { authRouter } = require('./auth.router');
const { profileRouter } = require('./profile.router');
const { lifeStyleRouter } = require('./lifeStyle.router');
const imageRoute = require('./getImage.router')
const { skipedRouter } = require('./skiped.router');
// // const { fileRouter } = require('./file.router');
const { profileLikeRouter } = require('./profileLike.router');
const { MessageRouter } = require('./message.router');
const { profileVisitorRouter } = require('./profile.visitor.router');
const config = require('../helpers/environment/config');
const { storyRouter } = require('./story.router');
const { generateRtcToken, generateRtmToken } = require('./testAudioAndVideo.router');

/**
 * Generates all routes for the application.
 * @param {Function} app - Express Function
 */
const prefix = `/${config.baseAPIRoute}`;
const addRoutes = (app) => {
  app.use(`${prefix}/`, imageRoute);
  app.use(`${prefix}/user`, userRouter);
  app.use(`${prefix}/status`, statusRouter);
  app.use(`${prefix}/role`, roleRouter);
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/address`, bookmarkRouter);
  app.use(`${prefix}/review`, reviewRouter);
  app.use(`${prefix}/package`, packageRouter);
  app.use(`${prefix}/post`, postRouter);
  app.use(`${prefix}/profile`, profileRouter);
  app.use(`${prefix}/like`, profileLikeRouter);
  app.use(`${prefix}/life-style`, lifeStyleRouter);
  app.use(`${prefix}/skip`, skipedRouter);
  app.use(`${prefix}/visit`, profileVisitorRouter);
  app.use(`${prefix}/message`, MessageRouter);
  app.use(`${prefix}/story`, storyRouter);
  app.use(`${prefix}/generateRtcToken`, generateRtcToken);
  app.use(`${prefix}/generateRtmToken`, generateRtmToken);
};
module.exports = {
  addRoutes,
};
