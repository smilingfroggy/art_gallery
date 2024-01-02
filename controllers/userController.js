const bcrypt = require('bcryptjs')
const db = require('../models')
const { User } = db
const helpers = require('../helpers/auth-helpers')
const userService = require('../services/userService')

const userController = {
  signUp: async (req, res, next) => {
    try {
      await userService.signUp(req)
      req.flash('success_messages', 'Registered Successfully')
      return res.redirect('/user/login')
    } catch (error) {
      console.log(error)
      next(error)
    }
  },
  login: async (req, res, next) => {
    req.flash('success_messages', 'Log in successfully')
    res.redirect('/artworks')
  },
  logout: (req, res, next) => {
    try {
      req.flash('success_messages', 'Log out successfully')
      req.logOut(() => res.redirect('/user/login'));
    } catch (error) {
      console.log(error)
      next(error)
    }
  },
  getProfile: async (req, res, next) => {
    try {
      const user = helpers.getUser(req)
      return res.render('profile', user )
    } catch (error) {
      console.log(error)
      next(error)
    }
  },
  putProfile: async (req, res, next) => {
    try {
      const userId = helpers.getUser(req).id
      const { name, password, passwordCheck } = req.body
      if (!name || !password || !passwordCheck) throw new Error('Please provide complete messages')
      if (password !== passwordCheck) throw new Error('Passwords do not match')

      await User.update({
        name,
        password: bcrypt.hashSync(password, 10)
      },{
        where: { id: userId }
      })

      req.flash('success_messages', 'Updated Successfully')
      return res.redirect('back')
    } catch (error) {
      console.log(error)
      next(error)
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body
      if (!email) throw new Error('Please provide complete messages')

      const user = await User.findOne({ where: { email }})
      if (!user) throw new Error('No user with this email')
      
      // generate OTP
      const random = Math.random().toString(36).slice(-8)
      const expiredAt = Date.now() + 1000 * 60 * 10 // 10 mins
      await user.update({ otp: random, expiredAt: expiredAt })
      
      // send email
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      })
      await transporter.verify()

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Art-Gallery Reset Password',
        html: `<h3>Your OTP is: </h3> <strong> ${random} </strong> <br><br> <h3>Expired in ten minutes.</h3>`
      }
      await transporter.sendMail(mailOptions)
      console.log('Email sent')

      req.flash('success_messages', 'Email was sent successfully. Please check your email')
      return res.redirect('/user/reset-password')
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
}


module.exports = userController