import jwt_decode from "jwt-decode";
const key = 'credentials_customer';

function Credentials(token, refresh, expires, privileges, profile) {
  this.token = token;
  this.refresh = refresh;
  this.expires = expires;
  this.privileges = privileges;
  this.profile = profile;
}

Credentials.fromResponse = function({oauthToken, profile}) {
  const decoded = jwt_decode(oauthToken);
  const privileges = decoded.authorities.split(',');
  // decoded.exp is milliseconds
  return new Credentials(oauthToken, oauthToken, decoded.exp * 1000, privileges, profile)
}

// Read from NetworkResponse data
/*
Credentials.fromResponse = function({oauthToken, refreshToken, expiresIn, privileges, profile}){
  return new Credentials(oauthToken, refreshToken, expiresIn * 1000, privileges, profile);
};
*/

// Read write from State object.
Credentials.fromState = function({token, refresh, expires, privileges, profile}) {
  return new Credentials(token, refresh, expires, privileges, profile);
};

Credentials.prototype.toState = function(){
  let result = {
    token: this.token,
    refresh:this.refresh,
    expires:this.expires,
    privileges:this.privileges,
    profile: this.profile,
    // This property is for routing.
    isAuthenticated: this.isValid() && (this.isTokenValid() || this.isRefreshTokenValid())
  };

  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });

  return result;
};

// Read write from Local Storage Object.
Credentials.fromStorage = function(){
  try {
    const base64 = localStorage.getItem(key);
    const json = window.atob(base64 || "");

    const {token, refresh, expires, privileges, profile} = JSON.parse(json);
    return new Credentials(token, refresh, expires, privileges, profile);
  }catch(e){}
  return new Credentials();
};

Credentials.prototype.save2Storage = function(){
  try {
    const json = JSON.stringify(this.toState());
    localStorage.setItem(key, window.btoa(json));
  }catch(e){}
};

Credentials.clearStorage = function(){
  localStorage.removeItem(key);
};

Credentials.prototype.isValid = function(){
  return (this.token && this.expires && !isNaN(this.expires));
};

Credentials.prototype.isTokenValid = function() {
  const now = new Date().getTime();
  return this.isValid() && now < (this.expires - 3000);    //Delta is 3 seconds
};

Credentials.prototype.isRefreshTokenValid = function(){
  return this.isTokenValid();
};

export default Credentials;
