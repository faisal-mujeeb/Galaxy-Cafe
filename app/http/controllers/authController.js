const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../../models/user');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    // api_key:'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'
    pass: process.env.EMAIL_PASS,
  },
});

function authController() {

  const _getRedirectUrl = (req) => {
    return req.user.role === 'admin' ? '/admin/orders' : '/menus';
  }

  return {
    login(req, res) {
      res.render('auth/login');
    },
    resetPasswordPage(req,res){
      res.render('auth/reset');
    },
    getNewPassword(req,res){
      const token = req.params.token;
      User.findOne({resetToken :token, resetTokenExpiration: {$gt : Date.now()} }).then(user=>{
        if(!user){
          req.flash("error", 'session timed out!');
          return res.redirect("/reset");
        }
        res.render("auth/newPassword", {
          userId: user._id.toString(),
          passwordToken: token
        });

      }).catch(err=>{
        console.log(err);
      });
    },
    doNewPassword(req,res){
      const passwordToken = req.body.passwordToken;
      const userId = req.body.userId;
      const newPassword = req.body.password;
      User.findOne({_id: userId, resetToken:passwordToken, resetTokenExpiration: {$gt: Date.now()}}).then(user=>{
        if(!user){
          req.flash("error", 'session timed out!');
          return res.redirect("/reset");
        }
        bcrypt.hash(newPassword, 12).then(hashPw=>{
          user.password = hashPw;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        }).then(result=>{
          res.redirect("/login");
        }).catch(err=>{
          console.log(err);
        });

      });
    },
    doResetPassword(req,res){
      const email = req.body.email;
      crypto.randomBytes(32, (err,buffer)=>{
        if(err){
          console.log(err);
          return res.redirect("/reset");
        }
        const token = buffer.toString("hex");
        User.findOne({email:email}).then(user=>{
          if(!user){
            req.flash('error', 'Email not registered!');
            return res.redirect("/reset");
          }
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        }).then(result=>{
          res.redirect("/");
          transporter.sendMail({
            to: email,
            from: "galaxycafe2425@gmail.com",
            subject: "Password Reset from Galaxy Cafe",
            html: `<h1>You requested for password reset!</h1>
                  <p>Click this <a href="http://localhost:3034/reset/${token}"> link </a> to set new password.</p>`,
          });
        })
        .catch(err=>{
          console.log(err);
        })

      })
    },
    doLogin(req, res, next) {
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          req.flash('error', info.message);
          return next(err);
        }
        if (!user) {
          req.flash('error', info.message);
          return res.redirect('/login');
        }
        req.logIn(user, (err) => {
          if (err) {
            req.flash('error', info.message);
            return next(err);
          }
          return res.redirect(_getRedirectUrl(req))
        })
      })(req, res, next);
    },
    register(req, res) {
      res.render('auth/register');
    },
    async doRegister(req, res) {
      const {
        name,
        email,
        password
      } = req.body;

      // Validation
      if (!name || !email || !password) {
        req.flash('error', 'All fields required');
        req.flash('name', name);
        req.flash('email', email);
        return res.redirect('/register');
      }

      User.exists({
        email
      }, (err, result) => {
        if (result) {
          req.flash('error', 'Email already used');
          req.flash('name', name);
          req.flash('email', email);
          return res.redirect('/register');
        }
      })

      const hashPw = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashPw
      });
      user.save().then(() => {
        // login
        req.flash('success', 'Account created. Login to continue.');
        return res.redirect('/login');
      }).catch((err) => {
        req.flash('error', 'Something went wrong');
        return res.redirect('/register');
      });
    },
    logout(req, res) {
      req.logout(err=>{
        if(err)
          console.log(err);
         else 
          return res.redirect('/login')
      });
    }
  };
}

module.exports = authController;