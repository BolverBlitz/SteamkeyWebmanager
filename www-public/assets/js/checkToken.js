/**
 * This will check the current saved Token (if exists) if its valid
 * @param {boolean} NoForward If ture, it will not forward to login page
 * @returns {Promise}
 */
function CheckTokenValidity(NoForward = false) {
  return new Promise(function (resolve, reject) {
    const getUrl = window.location;
    const baseUrl = getUrl.protocol + "//" + getUrl.host + "/";
    if (localStorage.getItem("token") !== null) {
      //Token was found, now validate it and if valid forward to /public
      const posting = $.post(`${baseUrl}api/application/login/check`, {
        token: localStorage.getItem("token")
      });
      posting.done(function (result) {
        writeTokenDataToLocalStorrage(result.TokenData);
        resolve(result.TokenData)
      })
      posting.fail(function (err) {
        if (err.status === 401) {
          clearLocalStorrage()
          const getUrl = window.location;
          const baseUrl = getUrl.protocol + "//" + getUrl.host + "/";
          if(!NoForward){
            window.location.replace(`${baseUrl}`); //2Fa Login Page
          }
        }
      });
    } else {
      clearLocalStorrage()
      if(!NoForward){
        window.location.replace(`${baseUrl}login`); //2Fa Login Page
      }
    }
  });
}

/**
 * This will wirte all Token data to localstorrage to be used in all funktions
 * @param {object} TokenData Token Object
 */
function writeTokenDataToLocalStorrage(TokenData) {
  localStorage.setItem('username', TokenData.username);
  localStorage.setItem('lang', TokenData.lang);
}

/**
 * This will delete all localStorrage keys that are set on login
 */
function clearLocalStorrage() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('lang');
  localStorage.removeItem('permssions');
}

/**
 * Logout function
 */
function logout() {
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/";
  if (localStorage.getItem("token") !== null) {
    const posting = $.post(`${baseUrl}api/application/login/logout`, {
      token: localStorage.getItem("token")
    });
    posting.done(function (result) {
      clearLocalStorrage()
      setTimeout(function () { window.location.replace(`${baseUrl}`); }, 150);
    })
    posting.fail(function (err) {
      if (err.status === 401) {
        console.log(err)
      } else if (err.status === 500) {
        console.log(err)
      }
    });
  }
}

function login() {
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/";
  window.location.replace(`${baseUrl}login`);
}