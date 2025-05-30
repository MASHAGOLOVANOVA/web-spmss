import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'universal-cookie';
import { Row,  Button, Col, Form} from 'react-bootstrap';
import { GetUtcDate } from 'pages/shared/FormatDates';
import { useNavigate   } from 'react-router-dom';

const cookies = new Cookies();

let loginReqOptions = {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Content-Type": "application/json",
    },
};

function Register() {
    const [formData, setFormData] = useState({});
    const history = useNavigate();

    useEffect(() => {
        if (cookies.get('session_token') !== undefined) {
           history('/', {replace: true});
        }
        setFormData(values => ({ ...values, }))
    }, []);


    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(values => ({ ...values, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        event.target.reset();
        console.log(formData)
        loginReqOptions["body"] = JSON.stringify(formData)
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/signup`, loginReqOptions)
            const status = response.status;
            console.log("Responce status:", status);
            if (status === 200) {
                const json = await response.json()
                cookies.set('session_token', json.session_token, { path: '/', "expires": GetUtcDate(json.expires_at) })
                window.location.reload();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }


    return (
        <>

            <Row className='justify-content-center'>
                <Col xs={11} md={10} lg={8}>
                    <Row className='justify-content-center'>
                        <Col md="auto"><h1 className='mb-4'>Вход в систему</h1></Col>
                        <hr />
                        <div >
                            <Row className='justify-content-center'>
                                <Col xs={12} sm={4}>
                                    <Form onSubmit={handleSubmit} className='mb-3'>
                                        <Form.Group className="mb-3" controlId="login">
                                            <Form.Label>Номер телефона *</Form.Label>
                                            <Form.Control name="username" onChange={handleChange} required placeholder="+79991111111" />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="pwd">
                                            <Form.Label>Пароль *</Form.Label>
                                            <Form.Control type="password" name="password" onChange={handleChange} required placeholder="password" />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="name">
                                            <Form.Label>Имя *</Form.Label>
                                            <Form.Control name="name" onChange={handleChange} required placeholder="" />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="surname">
                                            <Form.Label>Фамилия *</Form.Label>
                                            <Form.Control name="surname" onChange={handleChange} required placeholder="" />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="middlename">
                                            <Form.Label>Отчество *</Form.Label>
                                            <Form.Control name="middlename" onChange={handleChange} required placeholder="" />
                                        </Form.Group>

                                        <Row className='justify-content-center'>
                                            <Button type="submit" className="col col-auto style-button">
                                                Зарегистрироваться
                                            </Button>
                                        </Row>
                                    </Form>
                                </Col>
                            </Row>
                        </div>
                    </Row>
                </Col>
            </Row>
        </>
    );
};

export default Register;