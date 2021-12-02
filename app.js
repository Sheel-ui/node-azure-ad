const express = require('express');
const routes = require('./routes/routes');
const passport = require("passport");
const passport_azure_ad = require("passport-azure-ad");
const express_session = require("express-session");
const config = require("./passport/config");
const OIDCStrategy = passport_azure_ad.OIDCStrategy;
const app = express();
const users = [];


app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));
app.use(routes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express_session({
    resave: true,
    saveUninitialized: true,
    secret: "this should be longer and stored elsewhere"
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.oid);
});

passport.deserializeUser(function (oid, done) {
    findByOid(oid, function (err, user) {
        done(err, user);
    });
});

var findByOid = function (oid, fn) {
    for (let i=0; i<users.length; i++) {
        if (users[i].oid === oid) return fn(null, users[i]);
    }
    return fn(null, null);
};

passport.use(new OIDCStrategy({
    identityMetadata: config.metadataUrl,
    clientID: config.appID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: config.redirectUrl,
    allowHttpForRedirectUrl: true,
    clientSecret: config.appSecret,
    loggingLevel: 'error',
}, function (iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
        return done(new Error('No oid found'), null);
    }
        findByOid(profile.oid, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                console.log('CREATING USER ', profile.oid);
                users.push(profile);
                return done(null, profile);
            }
            console.log('USER EXISTS, RETREVING USER ', profile.oid);
            return done(null, user);
        });
}));

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/signin');
}

app.get('/signin', function (req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/fail',
    })(req, res, next);
}, function (req, res) {
    res.redirect('/account');
});

app.post('/signin', function (req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/fail',
    })(req, res, next);
}, function (req, res) {
    res.redirect('/account');
});

app.get('/account', ensureAuthenticated, (req,res) => {
  res.render('account', {user: req.user.displayName});
});

app.get('/user', ensureAuthenticated, function (req, res) {
    res.send(req.user);
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        req.logOut();
        res.redirect(config.logoutUrl);
    });
});

app.listen(3000)
