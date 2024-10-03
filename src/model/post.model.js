const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
}, {
  timestamps: true, 
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
