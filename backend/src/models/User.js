const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { ROLES } = require('../config/constants')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false  // never return password in queries by default
  },

  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.EMPLOYEE
  },

  department: {
    type: String,
    trim: true
  },

  // who this employee reports to (manager)
  // null for admin and top-level managers
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true })


// hash password before saving
userSchema.pre('save', async function(next) {
  // only hash if password was modified or is new
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})


// instance method to compare passwords during login
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}


module.exports = mongoose.model('User', userSchema)
