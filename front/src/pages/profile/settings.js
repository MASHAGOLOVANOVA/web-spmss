import React, { useEffect } from 'react';
import Cookies from 'universal-cookie';
import { useParams } from "react-router-dom";
import { Col, Row} from 'react-bootstrap';
import ProfileSidebar from './ProfileSidebar';

const cookies = new Cookies();
const reqOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token')
    }
};

function Settings() {
    // const [user, setUser] = useState(null);
    let { accountId } = useParams();


    useEffect(() => {
        // fetch('https://spams-site.ru/api/v1/accounts/' + accountId, reqOptions)
        //     .then(response => response.json())
        //     .then(json => setUser(json))
        //     .catch(error => console.error(error));
    }, []);
    return (
        <>
            <Row className='m-2'>
                <Col xs={12} sm={12} md={4} lg={2}>
                    <ProfileSidebar accountId={accountId} />
                </Col>
                <Col xs={12} sm={12} md={8} lg={10} className='px-5'>

                </Col>
            </Row>
        </>
    );
};

export default Settings;