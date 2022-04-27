const i18n = new I18n({
  fallback: 'en',
  languages: {
    en: {
      "Welcome": "Welcome",
    },
  }
});

/**
* Will translate a key value to the language of the token
* @param {string} Key Object Key to translate
* @param {object} Variables
* @returns {string} Transladed String
*/
function translate(Key, Variables) {
  if (Variables) {
    return i18n.translate(localStorage.getItem('lang'), Key, Variables);
  } else {
    return i18n.translate(localStorage.getItem('lang'), Key);
  }
}

function convertFlags(lang_string) {
  if (lang_string === "de") {
    return '<img width="18" height="14" src="https://twemoji.maxcdn.com/v/13.1.0/72x72/1f1e9-1f1ea.png">'; // 🇩🇪
  } else if (lang_string === "en") {
    return '<img width="18" height="14" src="https://twemoji.maxcdn.com/v/13.1.0/72x72/1f1ec-1f1e7.png">'; // 🇬🇧
  } else if (lang_string === "ua") {
    return '<img width="18" height="14" src="https://twemoji.maxcdn.com/v/13.1.0/72x72/1f1fa-1f1e6.png">'; // 🇺🇦
  } else if (lang_string === "it") {
    return '<img width="18" height="14" src="https://twemoji.maxcdn.com/v/13.1.0/72x72/1f1ee-1f1f9.png">'; // 🇮🇹
  } else {
    return lang_string
  }
}

//Get Browser Language and store it in localstorage
function setLanguageKey() {
  if (!localStorage.getItem('lang')) {
    let userLang = navigator.language.substring(0, 2).toLocaleLowerCase() || navigator.userLanguage.substring(0, 2).toLocaleLowerCase();
    localStorage.setItem('lang', userLang)
  }
}

//Gets triggerd by the language selector, will update the Language in Client and send API Request
function chanceLanguageEvent() {
  if (localStorage.getItem("token") !== null) {
    const getUrl = window.location;
    const baseUrl = getUrl.protocol + "//" + getUrl.host + "/";

    const exportjson = JSON.stringify({
      lang: $("#countries").val()
  })

    const posting = $.ajax({
      url: `${baseUrl}api/mshc/mshc_users/setLang`,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      headers: { "Authorization": 'Bearer ' + localStorage.getItem('token') },
      data: exportjson,
      success: function (data) {
        localStorage.setItem('lang', $("#countries").val());
        location.reload();
      },
      error: function (err) {
        alert("Language Error")
      }
  });
  }
}

//Set client language
setLanguageKey();