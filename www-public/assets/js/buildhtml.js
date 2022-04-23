/**
 * Will create the header based on active and persmissions
 * @param {string} active Current HTML
 * @returns {Promise}
 * User:  
 * Admin: ADMINOVERVIEW
 */
function createHeaderLinks(active) {
    let HeaderHTML = "";

    /*
    * User - Load always
        if(active.toLowerCase() === "INDEX".toLowerCase()){
            HeaderHTML += `<li><a href="index.html" class="active">${translate('Header.Links.Startseite')}</a></li>`
        }else{
            HeaderHTML += `<li><a href="index.html">${translate('Header.Links.Startseite')}</a></li>`
        }
    */

    //Load based on permissions
    if (localStorage.getItem("permssions") !== null) {
        const permissions = JSON.parse(localStorage.getItem("permssions"));
        for(let i = 0; i < permissions.length; i++){
            //Load all pages becase admin
            if (permissions[i].permission.includes("admin")) {
                if(active.toLowerCase() === "SETTINGS".toLowerCase()){
                    HeaderHTML += `<li><a href="adminsettings" class="active">${translate('Header.Links.MSHCSettings')}</a></li>`
                }else{
                    HeaderHTML += `<li><a href="adminsettings">${translate('Header.Links.MSHCSettings')}</a></li>`
                }
            }
        }
    }

    if (localStorage.getItem('token')) {
        HeaderHTML += `<li><p id="logout" onclick="logout()">${"Logout"}</p></li>`
    } else {
        if (active.toLowerCase() === "login".toLowerCase()) {
            HeaderHTML += `<li><p><a href="login" class="active">${translate('Header.Links.Einloggen')}</a></p></li>`
        } else {
            HeaderHTML += `<li><p><a href="login">${translate('Header.Links.Einloggen')}</a></p></li>`
        }
    }

    $("#LinksList").html(HeaderHTML);
}