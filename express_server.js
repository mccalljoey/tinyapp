const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.post("/register", (req, res) => {
  const user_ID = generateRandomString(6);
  const userEmail = req.body['email'];
  // const userPassword = bcrypt.hashSync(req.body.password, salt);
  const newUser = {
    "id": user_ID,
    "email": userEmail,
    "password": userPassword
  };
  if (!req.body.email || !req.body.password) {
    console.log("400 error");
    res.status(400).send("Invalid email and password");
  } else if (emailTaken(userEmail)) {
    console.log("400 error");
    res.status(400).send("Email has already been registered!");
  } else {
    req.session.user_ID = newUser.id;
    users[user_ID] = newUser;
    res.redirect("/urls");
  }
});

const generateRandomString = function (data) {
  let string = ""
  let alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz0123456789";
  for (let i = 0; i < data; i++) { 
  string += alphaNum[Math.floor(Math.random() * 62)];
  }
  return string;
};

app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params['shortURL'];
  console.log(req.params);
  urlDatabase[shortURL] // {userID: ???, longURL: ????}
  res.redirect(urlDatabase[shortURL].longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: req.params.longURL };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
const shortURL = req.params.id;
const user_ID = req.session.user_ID;
const user = users[user_ID];
if(urlDatabase[shortURL].userID === user_ID) {
  const templateVars = { 
    shortURL, 
    longURL: urlDatabase[shortURL].longURL, 
    user
  };
  res.render("urls_show", templateVars);
} else if (!user) {
res.status(403).send("You're not logged in!")
} else {
  res.status(403).send("This is not your account!")
}
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_ID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(550).send("You can't do that");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_ID === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id]
    res.redirect("/urls")
  } else {
    res.status(550).send("Something went wrong!");
  }
});

app.get("/login", (req, res) => {
  const user_ID = req.session.user_ID;
  const templateVars = {
    user: users[user_ID]
  };
  if (user_ID) {
    res.redirect("/urls")
  } else {
    res.render("urls_login", templateVars)
  };
});

app.post("/login", (req, res) => {
  let user = emailTaken(req.body['email']);
    if (!user) {
      console.log("403 error");
      res.status(403).send("Invalid email and password");
    } else if (!bcrypt.compareSync(req.body.password, user.password)) {
      console.log("403 error");
      res.status(403).send("Email has already been registered!");
    } else {
      req.session.user_ID = user.id;
    res.redirect("/urls");
    }
  });

  function urlsForUser(id) {
    let userURLs = {};
    for (let urlKey in urlDatabase) {
      if ( id === urlDatabase[urlKey].userID) {
        userURLs[urlKey] = urlDatabase[urlKey];
      }
    }
    return userURLs;
  };

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});