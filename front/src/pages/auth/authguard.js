import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const AuthGuard = (props) => {

    const reqOptions = {
        method: "GET",
        mode: "cors",
        cache: "default",
        credentials: 'include',
        headers: {
            "Session-Id": cookies.get('session_token')
        }
    };

    let auth = (cookies.get('session_token') !== undefined) ? true : null;
    fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/pingauth`, reqOptions).then(response => {
        if (response.status === 401) {
            if (cookies.get('session_token') !== undefined) {
                cookies.remove('session_token', { "path": "/" });
                // auth = (cookies.get('session_token') !== undefined) ? true : null;
                window.location.reload();
            }
        }
        if (response.status !== 200) {
            throw Error(`bad responce code ${response.status}`);            
        }
        
    }).catch(error => console.error(error))


    return  auth ? props.Component : <Navigate to="/login" />;

}

export default AuthGuard