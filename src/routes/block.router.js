/* eslint-disable linebreak-style */
/* eslint-disable import/no-unresolved */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/block.controller');
const { verifyAccessToken } = require('../helpers/authentication/jwt_helper_user')

// GET: Welcome/info route
router.get('/info', controller.getInfo);

// POST: Block a user
router.post('/block-user', verifyAccessToken, controller.create);

// PUT: Unblock a user
router.put('/unblock-user', verifyAccessToken, controller.updateById);

// GET: List all currently blocked users
router.get('/blocked-users', verifyAccessToken, controller.getList);

// GET: Get block record detail by ID
router.get('/getBlockedUserById', verifyAccessToken, controller.getDataById);

// PUT: Soft delete a block record (mark as inactive)
router.put('/deactivate-block/:id', verifyAccessToken, controller.deleteDataById);

// DELETE: Permanently delete a block record
router.delete('/delete-block/:id', verifyAccessToken, controller.permanentDeleteDataById);

// GET: View unblocked user history
router.get('/unblocked-history', verifyAccessToken, controller.getDeletedList);

module.exports = {
    blockRouter: router
};
