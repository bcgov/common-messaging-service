const qS = document.querySelector.bind(document);

const OAUTH_URL = `https://i1api.nrs.gov.bc.ca/oauth2/v1/oauth/token?disableDeveloperFilter=true&grant_type=client_credentials&scope=CMSG.*`;
const CMSG_ROOT_URL = `https://i1api.nrs.gov.bc.ca/cmsg-messaging-api/v1/`;
const CMSG_MESSAGES_URL = `${CMSG_ROOT_URL}messages`;


var oauth = {
    authenticated: false,
    token: '',
    hasTopLevel: false,
    hasCreateMessage: false,
    fetch: function(event) {
        event.preventDefault();
        event.stopPropagation();

        qS('#emailForm').style.display = 'none';
        qS('#emailForm button[type="submit"]').disabled = true;

        oauth.authenticated = false;
        oauth.token = '';
        oauth.hasTopLevel = false;
        oauth.hasCreateMessage = false;

        qS('#credentialsInd').classList = "icon unknown";
        qS('#apiAccessInd').classList = "icon unknown";
        qS('#createMsgInd').classList = "icon unknown";
        qS('#healthCheckInd').classList = "icon unknown";

        const sc = qS("#scName").value;
        const pw = qS("#scPassword").value;

        const headers = new Headers();
        headers.set(
            "Authorization",
            "Basic " + window.btoa(sc + ':' + pw)
        );

        fetch(OAUTH_URL, {
            method: "get",
            headers: headers
        })
        .then(resp => resp.json())
        .then(function (data) {
            var credentialsClass = "bad";

            if (data.error) {
                if ("unauthorized" === data.error && "Bad credentials" === data.error_description) {
                    credentialsClass = "bad";
                } else {
                    showError(`An error occured while fetching a token. Error: ${data.error} - ${data.error_description}`);
                    throw new Error(data.error);
                }
            } else {
                credentialsClass = "good";
            }

            // show the health check indicators section
            qS('#healthCheck').style.display = 'block';

            qS('#credentialsInd').classList = "icon " + credentialsClass;

            if (credentialsClass === "good") {
                // parse out the token...
                oauth.authenticated = data.access_token && data.access_token.length >= 16;
                if (!oauth.authenticated) {
                    showError("An error occured while fetching a token. See console for more details.");
                    throw new Error();
                }
                oauth.token = data.access_token;
                console.log(`token: ${oauth.token}`)

                // do we actually have access we need to hit api? to send a message?
                oauth.hasTopLevel = (data.scope.split(" ").indexOf("CMSG.GETTOPLEVEL") >= 0);
                oauth.hasCreateMessage = (data.scope.split(" ").indexOf("CMSG.CREATEMESSAGE") >= 0);

                var apiAccessClass = oauth.hasTopLevel ? "good" : "bad";
                var createMsgClass = oauth.hasCreateMessage ? "good" : "bad";
                qS('#apiAccessInd').classList = "icon " + apiAccessClass;
                qS('#createMsgInd').classList = "icon " + createMsgClass;

                // check if api is up
                if (oauth.hasTopLevel) {
                    healthCheck(oauth.token);
                }

            }
        })
        .catch(function (error) {
            console.log(`ERROR, caught error fetching token from ${OAUTH_URL}`);
            console.log(error);
        });


    }
}


function healthCheck(token) {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    var healthCheckClass = "bad";

    fetch(CMSG_ROOT_URL, {
        method: "GET",
        headers: headers
    }).then(function(response) {
        if (response.status == 200) {
            //healthy...
            healthCheckClass = "good";
            // open up the send email part of the form...
            qS('#emailForm').style.display = 'block';
            qS('#emailForm button[type="submit"]').disabled = false;
        }

        // set the class indicators...
        qS('#healthCheckInd').classList = "icon " + healthCheckClass;
    })
        .catch(function (error) {
            console.error("Error pinging cmsg:", error);
            showError("An error occured while pinging the cmsg api. See console for more details.");
        });

}

function sendEmail(event) {

    if (this.checkValidity() === false) {
        return;
    }

    if (!oauth.authenticated) {
        console.error("sendEmail - not authenticated");
        return;
    }

    if (!oauth.hasCreateMessage) {
        console.error("sendEmail - not allowed to create message, check scopes.");
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    postToCmsg(oauth.token);

}


function postToCmsg(token) {

    // Things that aren't in the UI to enter
    const defaults = `
    {
        "@type" : "http://nrscmsg.nrs.gov.bc.ca/v1/emailMessage",
        "links": [
        ],
        "delay": 0,
        "expiration": 0,
        "maxResend": 0,
        "mediaType": "text/plain"
    }
    `
    // Add the user entered fields
    const requestBody = JSON.parse(defaults);
    requestBody.sender = qS("#sender").value;
    requestBody.subject = qS("#subject").value;
    requestBody.message = qS("#body").value;
    requestBody.recipients = qS("#recipients").value.replace(/\s/g, '').split(",");

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    fetch(CMSG_MESSAGES_URL, {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: headers
    })
        .then(res => res.json())
        .then(function (response) {
            console.log(response);
            $('#successModal').modal('show');
        })
        .catch(function (error) {
            console.error("Error posting email:", error);
            showError("An error occured while sending the email. See console for more details.");
        });
}


function showError(text) {
    $('#errorModal').modal('show'); // need the jQuery object to call the bootstrap modal method
    $('#errorModal .modal-body p').text(text);
}

qS('#emailForm').style.display = 'none';
qS('#emailForm button[type="submit"]').disabled = true;

qS("#scForm").addEventListener("submit", oauth.fetch);
qS("#emailForm").addEventListener("submit", sendEmail);
qS("#doneButton").addEventListener("click", function () { window.scrollTo(0, 0); location.reload(true); });
