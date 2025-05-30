import React from 'react';
import Cookies from 'universal-cookie';
import {  Button,  } from 'react-bootstrap';


const cookies = new Cookies();

const googleDriveAuth = `${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/integration/authlink/googledrive`;
const returnURL = `${process.env.REACT_APP_ADDR}/`;

const reqOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token')
    }
};

function GoogleDrive() {
    function OpenAuth() {
        fetch(`${googleDriveAuth}?redirect=${returnURL}`, reqOptions)
        .then(response => response.text())
        .then(url => window.open(url, "_blank", "noreferrer,noopener"))
        .catch(error => console.error(error));
    }
    return <>
    {/* дополнительное окно вполне может пригодиться, в частности для выбора корневой папки (правда как это сделать?) ну и мб для другой информации? */}
        <Button as="a" onClick={OpenAuth} className='style-button mb-3'>Авторизоваться в Google Drive (testing)</Button>
    </>
};

export default GoogleDrive;