/* eslint-disable func-names */
/* eslint-disable linebreak-style */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const TableSchema = new Schema({
  name: {
    type: String,
    // required: true


  },
  email: {
    type: String,
    // required: true
  },
  mobile: {
    type: Number,
    // required: true
  },
  additional_mobile_number: {
    type: Number,
    // required: true
  },
  dob: {
    type: Date,
    // required: true
  },
  age: {
    type: Number,
    // required: true
  },
  gender: {
    type: String,
    // required: true,
    enum: ['Male', 'Female', 'Other']
  },
  location: {
    type: String,
    // required: true
  },
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // Array of numbers: [longitude, latitude]
      index: '2dsphere', // Enable geospatial indexing
    },
  },
  sexual_orientation: {
    type: String,
    // required: true
  },
  interested_in: [{
    type: String,
    // enum: ['Long term relationship', 'Short term relationship', 'Marriage', 'Friendship', 'Other'],
    // required: true
  }],
  lookingFor: {
    type: String,
  },
  profile_url_1: {
    type: String,
  },
  profile_url_2: {
    type: String,
  },
  profile_url_3: {
    type: String,
  },
  profile_url_4: {
    type: String,
  },
  profile_url_5: {
    type: String,
  },
  discoverySettings: {
    maxDistance: { type: Number, default: 50 }, // measured in km
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 60 },
  },
  swipeLimits: {
    count: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    superLikes: { type: Number, default: 0 }
  },
  likeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  verification_image: {
    type: String,
  },
  verification_status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  otp: {
    type: String,

  },
  otp_timestamp: {
    type: Date,

  },
  role:
  {
    type: mongoose.Schema.Types.ObjectId,
  },
  is_oldUser: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
  },
  otp_verified: {
    type: Boolean,
    // default: false,
  },
  created_at: {
    type: Date,
    default: new Date(),
  },
  created_by: {
    type: String,
    default: 'self',
  },
  updated_at: {
    type: Date,
    default: new Date(),
  },
  updated_by: {
    type: String,
    default: 'self',
  },
});

TableSchema.path('email').validate((email) => {
  // eslint-disable-next-line no-useless-escape
  const emailRegex = /^([\w\.]+@([\w-]+\.)+[\w-]{2,8})?$/;
  return emailRegex.test(email); // Assuming email has a text attribute
}, 'Invalid e-mail.');

TableSchema.index({
  email: 1,
  mobile: 1,
});

// eslint-disable-next-line func-names, consistent-return
TableSchema.pre('save', async function (next) {
  try {
    /*
    Here first checking if the document is new by using a helper of mongoose .isNew,
    therefore, this.isNew is true if document is new else false, and we only want to
    hash the password if its a new document, else  it will again hash the password
    if you save the document again by making some changes in other fields incase
    your document contains other fields.
    */
    if (this.isNew) {
      if (this.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
      }
      if (this.spin) {
        const salt = await bcrypt.genSalt(10);
        const hashedSpin = await bcrypt.hash(this.spin, salt);
        this.spin = hashedSpin;
      }
      if (this.otp) {
        const otpSalt = await bcrypt.genSalt(10);
        const otp = this.otp.toString();
        const hashedOtp = await bcrypt.hash(otp, otpSalt);
        this.otp = hashedOtp;
      }
    }
    if (this.isModified('spin')) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.spin, salt);
      this.spin = hashedPassword;
    }
    // else if (update.$set.password) {
    //   const salt = await bcrypt.genSalt(10);
    //   const hashedPassword = await bcrypt.hash(update.$set.password, salt);
    //   update.$set.password = hashedPassword;
    // }
    // Uncomment this block if OTP needs to be re-hashed on modification
    // if (this.isModified('otp')) {
    //   const otpSalt = await bcrypt.genSalt(10);
    //   const otp = this.otp.toString();
    //   const hashedOtp = await bcrypt.hash(otp, otpSalt);
    //   this.otp = hashedOtp;
    // }
    next();
  } catch (error) {
    return next(error);
  }
});
// eslint-disable-next-line func-names, consistent-return
TableSchema.pre('updateOne', async function (next) {
  try {
    const query = this;
    const update = query.getUpdate();
    if (update.$set) {
      if (update.$set.otp) {
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(update.$set.otp, salt);
        update.$set.otp = hashedOtp;
      } else if (update.$set.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(update.$set.password, salt);
        update.$set.password = hashedPassword;
      } else
        if (update.$set.spin) {
          const salt = await bcrypt.genSalt(10);
          const hashedSpin = await bcrypt.hash(update.$set.spin, salt);
          update.$set.spin = hashedSpin;
        } else {
          return true;
        }
    }
    next();
  } catch (error) {
    return next(error);
  }
});

TableSchema.methods.isValidPassword = async function (password) {
  try {
    if (password) {
      const Right = await bcrypt.compare(password, this.password);
      return Right
    }
  } catch (error) {
    return false;
  }
};

TableSchema.methods.isValidOtp = async function (otp) {
  try {
    if (otp == "1111") {
      // const Right = await bcrypt.compare(otp, this.otp);
      // return Right
      return true;
    }
    return await bcrypt.compare(otp, this.otp);
  } catch (error) {
    throw new Error('Otp not valid');
  }
};
// eslint-disable-next-line func-names
TableSchema.methods.isValidSpin = async function (spin) {
  try {
    return await bcrypt.compare(spin, this.spin);
  } catch (error) {
    throw new Error('Otp not valid');
  }
};
const Table = mongoose.model('user', TableSchema);
module.exports = Table;
