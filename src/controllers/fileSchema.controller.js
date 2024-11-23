/* eslint-disable linebreak-style */
/* eslint import/no-unresolved: [2, { amd: true }] */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

const createError = require('http-errors');
const Model = require('../models/file.model');
const { ADMIN_SERVICE_WELCOME_MSG } = require('../helpers/resource/constants');

const ModuleName = 'File Record';
module.exports = {
  /**
 * Fetch the welcome message.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
    */
  getInfo: async (req, res) => res.status(200).json({ message: `${ADMIN_SERVICE_WELCOME_MSG(ModuleName)} Info Route Working` }),
  create: async (req, res, next) => {
    try {
      const data = req.body;
      data.created_at = new Date();
      data.updated_at = new Date();
      data.created_by = req.user ? req.user.mobile : 'unauth';
      data.updated_by = req.user ? req.user.mobile : 'unauth';
      const model = new Model(data);
      const savedModel = await model.save();
      // TODO: Set notifications for super admin to approve
      if (savedModel) {
        return res.status(200).json({ success: true, status: 200, message: 'Data Inserted Successfully' });
      }
      return next(createError.BadRequest('Failed to insert data.'));
    } catch (error) {
      return next(error);
    }
  },
  getList: async (req, res, next) => {
    try {
      const {
        // eslint-disable-next-line max-len
        filetype, is_approved, page, limit, sort,
      } = req.query;

      
      const _page = page ? Number(page) : 1;
      const _limit = limit ? Number(limit) : 20;
      const _skip = (_page - 1) * _limit;
      const _sort = sort || 'file_name';
      const query = {};
      if (filetype) {
        query.filetype = new RegExp(filetype, 'i');
      }

      if (is_approved) {
        query.is_approved = !!((is_approved && is_approved === 'true'));
      }
      let list = [];
      list = await Model.aggregate([
        {
          $match: query,
        },
        {
          $sort: { [_sort]: 1 },
        },
        {
          $skip: _skip,
        },
        {
          $limit: _limit,
        },
      ]);
      const resultCount = await Model.countDocuments(query);
      if (list) {
        return res.status(200).json({
          success: true,
          message: 'Data Fetched',
          status: 200,
          data: list,
          meta: {
            current_page: _page,
            from: _skip + 1,
            last_page: Math.ceil(resultCount / _limit, 10),
            per_page: _limit,
            to: _skip + _limit,
            total: resultCount,
          },
        });
      }
      return next(createError.BadRequest('Failed to get data.'));
    } catch (error) {
      return next(error);
    }
  },
};
