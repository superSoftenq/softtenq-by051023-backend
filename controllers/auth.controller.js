const db = require("../models");
const helper = require("./common")
require('dotenv').config();
const config = process.env;
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const separator = "___";
getHashById = (id) => {
  str = id.toString();
  str += separator + helper.ENCRYPT(id.toString());
  return str;
}
exports.signup = (req, res) => {

  // Save User to Database
  User.create({
    username: req.body.username.toLowerCase(),
    email: req.body.email.toLowerCase(),
    password: bcrypt.hashSync(req.body.password, 8),
    IsActive: -1
  })
    .then(user => {
      userId = user.id;
      str = getHashById(userId);
      helper.TRANSPORTER.sendMail({
        from: '"D&D 👻" <softenq030524@yandex.ru>', // sender address
        to: user.email, // list of receivers
        subject: "One last step", // Subject line
        text: `Hello, in order to complete the registration you have to follow the link ${helper.LOCALADDR}auth/confirm/${str}` // plain text body
        /*html: "<b>Hello world?</b>", // html body*/
      });
      if (req.body.roles) {
        
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "User was registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  reEmail = "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$";
  if (req.body.username.match(reEmail)){
    signinByEmail(req, res);
  } else {
    signinByUsername(req, res);
  }

};
exports.confirmRegistration = (req, res) => {
  hash = req.params["hashId"];
  strArr = hash.split(separator);
  userId = strArr[0];
  userIdHash = strArr[1];
  console.log(`userId crypted: ${helper.ENCRYPT(userId)} \n userIdHash: ${userIdHash}`)
  if(helper.ENCRYPT(userId) != userIdHash)
  {
    res.status(400).send({ message: "Invalid link"});
    return;
  }
  User.findOne({
    where: {
      id: userId
    }
  }).then(user => {
    if(!helper.IsDefined(user))
      {
        res.status(500).send({message: "User not found"})
        return;
      }
    if(user.IsActive != -1 && !helper.IsDefined(user.IsActive))
      {
        console.log(user.IsActive)
        res.status(400).send({ message: "The link has expired"});
        return;
      }
    user.IsActive = 1;
    user.save();
    res.status(200).send({message: "Confirmed!"})
    return;
  });
}

exports.changeCredentials = (req, res) => {
  userId = req.params["userId"]
  if(!helper.IsVID(userId))
    {
      res.status(400).send({message: "Invalid userId"})
      return;
    }
  User.findOne({
    where: {
      id: userId
    }
  }).then( user => {
    if(!user)
      {
        res.status(400).send({message: "User not found"})
        return;
      }
    str = getHashById(userId);
    helper.TRANSPORTER.sendMail({
      from: '"D&D 👻" <softenq030524@yandex.ru>', // sender address
      to: user.email, // list of receivers
      subject: "Resetting password", // Subject line
      text: `Hello, someone tried to change your account's credentials. If it was you, follow the link: ${helper.REMADDR}auth/reset/${str}` // plain text body
      /*html: "<b>Hello world?</b>", // html body*/
    });
    res.status(200).send({message: "Success!"});
  })

}
exports.changePassword = (req, res) => {
  passwordNew = req.body.password;
  userId = req.params["userId"];
  hash = req.body.hash;
  if(!helper.IsDefined(passwordNew))
    {
      res.status(400).send({message: "Invalid password"})
      return;
    }
  if(!helper.IsVID(userId))
    {
      res.status(400).send({message: "Invalid userId"});
      return;
    }
  if((getHashById(userId) != hash))
    { 
      console.log(`userId crypted: ${getHashById(userId)}\nhash: ${hash}`)
      res.status(400).send({message: "Invalid hash"});
      return;
    }
  User.findOne({
    where: {
      id: userId
    }
  }).then(user => {
    if(!user)
      {
        res.status(400).send({message: "User not found"});
        return;
      }
      user.password = bcrypt.hashSync(passwordNew, 8);
      res.status(200).send({message: "Success!"});
      return;
  })
}
/*
exports.changeEmail = (req, res) => {

}
*/

signinByEmail = (req, res) => {
  User.findOne({
    where: {
      email: req.body.username.toLowerCase()
    }
  })
  .then(user => signinCompare(req, res, user))
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};


signinByUsername = (req, res) => {
  
  User.findOne({
    where: {
      username: req.body.username.toLowerCase()
    }
  })
    .then(user => signinCompare(req, res, user))
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
}
signinCompare = (req, res, user) => {
  if (!user) {
    return res.status(404).send({ message: "User Not found." });
  }

  var passwordIsValid = bcrypt.compareSync(
    req.body.password,
    user.password
  );

  if (!passwordIsValid) {
    return res.status(401).send({
      accessToken: null,
      message: "Invalid Password!"
    });
  }

  const token = jwt.sign({ id: user.id },
                          config.secret,
                          {
                            algorithm: 'HS256',
                            allowInsecureKeySizes: true,
                            expiresIn: 86400, // 24 hours
                          });

  var authorities = [];
  user.getRoles().then(roles => {
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
      isActive: user.IsActive
    });
  });
}