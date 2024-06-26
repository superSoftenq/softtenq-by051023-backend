const db = require("../models");
const User = db.user;
const helper = require("./common");
const Relation = db.relation;
const UserLinksPhoto = db.user_links_photo;
const path = require('path')
const {google} = require('googleapis')
const KEYFILEPATH = path.join(__dirname + "/../credentials.json")
const SCOPES = ['https://www.googleapis.com/auth/drive']
const folderID = ['1vb8-adjrLWlsXnsb2odFlqOTDWHW-v_I']

const INT_MAX = 2147483647;
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES
})
const Op = db.Sequelize.Op;
const googleLink = "https://drive.google.com/file/d/";
exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
  };
  
  exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
  };
  
  exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
  };
  
  exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
  };
  exports.userPage = (req, res) => { 
    console.log(Number.isInteger (Number(req.params["userId"])))
    if(!Number.isInteger(Number(req.params["userId"]))){
      res.status(406).send("Invalid input")
      return;
    }
      User.findOne({
        where: {
          id: req.params["userId"]
        }
      }).then(user => {
        if (!user) {
          res.status(404).send({
            message: "Failed! User doesn't exist!"
          });
          return;
        }
        else{
          res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: helper.GetProfilePicture(user.profilePicture)
          });
        }
      });
    
  }
  exports.myProfile = (req, res) => {
    this.userPage(req, res);
  }
  exports.verifyUser = (req, res) => {
    res.status(200).send({userId: req.userId})
  }
  exports.settings = (req, res) => {
    try{
      console.log(req.userId)
      User.findOne({
        where: {
          id: req.body.userId
        }
      }).then(user => {
        user.username = req.body.username
        user.email = req.body.email
        user.save()
        res.status(200).send("User data changed successfully!");
      })
    } catch {
      res.status(500).send({message: "Congratulations! You've managed to successfully bypass all safety measures and crash backend app."})
    }
  }
  exports.searchForUser = (req, res) => {
    const USERCOUNT_DEFAULT = 20;
    let userCount = req.body.userCount;

    if(userCount === undefined || userCount === null || !Number.isInteger(userCount) || userCount > INT_MAX || userCount < 0){
      userCount = USERCOUNT_DEFAULT;
    }
    if(req.body.flags === undefined || req.body.flags === null || !Number.isInteger(req.body.flags) ){
      res.status(400).send({message: "Invalid flags"});
      return;
    }
    try{
      let flags = req.body.flags;
      let searchParam;
      let limit = userCount;
      switch(flags){
        case 0:
          searchParam = {
            where: {
              username: {
                [Op.startsWith]: req.body.username.toLowerCase()
              }
            }
          };
          console.log(req.body.username.toLowerCase())
          break;
        default:
          throw("Invalid flags");
      }
      searchParam.limit = limit
      let usersArray = [];
      User.findAll(searchParam).then(users => {
        if (!users) {
          res.status(400).send({
            message: "Failed! User doesn't exist!"
          });
          return;
        } else {
          users.forEach((user) => {
            let userJson = {
              id: user.id,
              username: user.username,
              email: user.email,
              profilePicture: helper.GetProfilePicture(user.profilePicture),
              isActive: user.IsActive
            };
            usersArray.push(userJson);
          });
          res.status(200).send(usersArray);
          return;
        }
      });
    } catch (e) {
      res.status(500).send({message: "Congratulations! You've managed to successfully bypass all safety measures and crash backend app."});
      return;
    }
  }