const i18n = new I18n({
  fallback: 'en',
  languages: {
    de: {
      Footer: {
        AGB: "AGB",
        Datenschutz: "Datenschutz",
        Impressum: "Impressum"
      },
      Header: {
        Links: {
          Startseite: "Startseite",
          FAQ: "FAQ",
          Ausloggen: "Ausloggen",
          Einloggen: "Einloggen",
          Registrieren: "Registrieren",
          AdminControl: "Admin Panel",
          MSHCSettings: "MSHC-Einstellungen"
        },
      },
      Pages: {
        adminoverview: {
          headline: "Admin Übersicht",
          applications: "Anwendungs Übersicht",
          overviewtext: "Es gab {{Connection}} Verbindungen in den letzten 4 Stunden. Protokol 1 wurde {{Protocol1}} mal gesendet und Protokol 2 {{Protocol2}} mal genutzt.<br>{{OSList}}<br>{{VersionList}}",
          tables: {
            status: {
              status: "Status",
              name: "Name",
              version: "Version",
              cpu: "CPU",
              memory: "RAM",
              arch: "Architektur",
              uptime: "Laufzeit",
              autorestart: "Automatischer Neustart",
              actions: "Aktionen"
            }
          },
          actions: {
            restart: "Server {{ServerName}} wurde neugestartet",
            stop: "Server {{ServerName}} wurde gestoppt",
            reload: "Server {{ServerName}} wurde neu geladen",
            gitpull: "Server {{ServerName}} wurde geupdated",
          }
        },
      }
    },
    en: {
      Footer: {
        AGB: "ToS",
        Datenschutz: "Privacy",
        Impressum: "Imprint"
      },
      Header: {
        Links: {
          Startseite: "Mainpage",
          FAQ: "FAQ",
          Ausloggen: "Logout",
          Einloggen: "Login",
          Registrieren: "Register",
          AdminControl: "Admin Panel",
          MSHCSettings: "MSHC-Settings"
        },
      },
      Pages: {
        adminoverview: {
          headline: "Admin Overview",
          applications: "Application Overview",
          overviewtext: "There where {{Connection}} connections in the past 4 hours. Protocol 1 was used {{Protocol1}} times and protocol 2 was used {{Protocol2}} times.<br>{{OSList}}<br>{{VersionList}}",
          tables: {
            status: {
              status: "Status",
              name: "Name",
              version: "Cersion",
              cpu: "CPU",
              memory: "RAM",
              arch: "Architecture",
              uptime: "Uptime",
              autorestart: "Autorestart",
              actions: "Actions"
            }
          },
          actions: {
            restart: "Server {{ServerName}} was restarted",
            stop: "Server {{ServerName}} was stopped",
            reload: "Server {{ServerName}} was reloaded",
            gitpull: "Server {{ServerName}} was updated",
          }
        },
      }
    },
    it: {
      Footer: {
        AGB: "Condizioni",
        Datenschutz: "Protezione ",
        Impressum: "Impronta"
      },
      Header: {
        Links: {
          Startseite: "Pagina principale",
          FAQ: "FAQ",
          Ausloggen: "Esci",
          Einloggen: "Accesso",
          Registrieren: "Registrati",
          AdminControl: "Pannello Amministratore",
          MSHCSettings: "MSHC-Impostazioni"
        },
      },
      Pages: {
        adminoverview: {
          headline: "Panoramica dell'amministratore",
          applications: "Panoramica dell'applicazione",
		  overviewtext: "Ci sono state {{Connection}} connessioni nelle ultime 4 ore. Protocollo 1 è stato usato {{Protocol1}} volte e protocollo 2 è stato usato {{Protocol2}} volte.<br>{{OSList}}<br>{{VersionList}}",
          tables: {
            status: {
              status: "Stato",
              name: "Nome",
              version: "Versione",
              cpu: "CPU",
              memory: "RAM",
              arch: "Architettura",
              uptime: "Tempo di attività",
              autorestart: "Riavvio automatico",
              actions: "Azioni"
            }
          }
        },
      }
    }
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
setLanguageKey()

//Set Footer language selection to current language
$("#countries").val(localStorage.getItem('lang'))