const mongoose = require("mongoose"),
  Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      required: true,
      type: String,
      index: true,
      unique: true,
    },
    userName: {
      required: false,
      type: String,
    },

    password: {
      required: true,
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// before saving , modify password by hashing
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
// inside function initialization of comparing password.
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
