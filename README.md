# Steamkey - Webmanager
 A easy way to keep track of all your steam keys in a secure place that also handles giveaways.

## Status of keys
 Each key has an assigned status.  
 | Status | Color  | Short | Meaning |
| ------------- | ------------- | ------------- | ------------- |
| Unused | 🟢  | ava | Key should most likly work|
| Unknown | 🟡  | unk | Key might be used already |
| Gifted | 🔵  | gif | A gift was created, but not claimed yet |
| Used | ⚫️  | use | Key got used after beeing claimed as gift |

## Powerfull parser for key input
You can input as many keys as you want at once, you need to be logged in to do so. Choose a state (Unused or Unknown) that you think the keys should get.
***The format must be:***
Name: Key
You can have : and - in your name. The key is validated with a regex.  
You get a pre parsed version in your browser, check that the names are complete and everything is in the correct collum, then click save.
It will check for duplicates and tell you in the top right corner how many keys got added.

## Useraccounts
Currently there is no way to create a account via the webpanel.  
To creat a user run `node ./tools/NewUser.js` in the repository root folder.

## Security
Keys are stored with AES encryption in your database. The key to decrypt them is in the repository root folder named `.key`.  
On application startup there is a check if the encryption key was not modifyed.
***Please keep this encryption key secure and backed up, it can't be regenerated!***
#### Inner logic to keep keys secure:
*A key can't be read from the webpage by any route if there isn't a gift created. If a gift exists, there must be a username supplyed (***Not a actual valid user***).*  
#### To create a gift:
*The key owner gets loaded from the database and compared to the username of the used webtoken, if both match the key must be status 1/2.*  
***Only then a gift gets created. All validation is done in the backend!***
#### XSS:
*Only actual users can store data in the database, every user input gets striped of all html tags.*
#### 2FA
*A user can choose to use 2FA when the accound is created. Workes with all apps like ***Google Authenticator****

# Installation
1. Clone this repo `git clone https://github.com/BolverBlitz/SteamkeyWebmanager`
2. `mv .env.example .env` and edit it
3. `npm i`
4. `node index.js

## PM2
`pm2 start index.js --name="SteamkeyWebmanager"`