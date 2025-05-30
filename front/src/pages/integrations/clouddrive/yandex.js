import React, { useEffect } from 'react';
import Cookies from 'universal-cookie';
import { Button } from 'react-bootstrap';

const cookies = new Cookies();

const yandexDiskAuth = `${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/integration/authlink/yandexdisk`;
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

function YandexDisk() {
    function OpenAuth() {
        fetch(`${yandexDiskAuth}?redirect=${returnURL}`, reqOptions)
            .then(response => response.text())
            .then(url => {
                // Открываем окно авторизации
                window.open(url, "_blank", "noreferrer,noopener");
            })
            .catch(error => console.error(error));
    }

    return (
        <>
            <Button as="a" onClick={OpenAuth} className='style-button mb-3'>
                Авторизоваться в Yandex Disk (testing)
            </Button>
        </>
    );
}

export default YandexDisk;