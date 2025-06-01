import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { Row, Button, Col, Form, Alert } from 'react-bootstrap';
import { GetUtcDate } from 'pages/shared/FormatDates';
import { useNavigate } from 'react-router-dom';
import InputMask from 'react-input-mask';

const cookies = new Cookies();

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        surname: '',
        middlename: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (cookies.get('session_token')) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        // Оставляем только цифры и плюс в начале
        const cleanedValue = value.replace(/[^\d+]/g, '');
        // Убедимся, что плюс только один и в начале
        const finalValue = cleanedValue.startsWith('+') ? 
            '+' + cleanedValue.slice(1).replace(/\D/g, '') : 
            cleanedValue.replace(/\D/g, '');

        setFormData(prev => ({
            ...prev,
            username: finalValue
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/signup`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка регистрации');
            }

            const data = await response.json();
            cookies.set('session_token', data.session_token, { 
                path: '/', 
                expires: GetUtcDate(data.expires_at) 
            });
            
            window.location.href = '/'; // Полный перезагруз страницы для обновления состояния авторизации
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || 'Произошла ошибка при регистрации');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Row className='justify-content-center'>
            <Col xs={11} md={10} lg={8}>
                <Row className='justify-content-center'>
                    <Col md="auto">
                        <h1 className='mb-4'>Регистрация</h1>
                    </Col>
                    <hr />
                    <Col xs={12} sm={8} md={6}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleSubmit} className='mb-3'>
                            <Form.Group className="mb-3" controlId="phone">
                                <Form.Label>Номер телефона *</Form.Label>
                                <InputMask
                                    mask="+7 (999) 999-99-99"
                                    maskChar=" "
                                    value={formData.username}
                                    className="form-control"
                                    name="username"
                                    onChange={handlePhoneChange}
                                    required
                                    placeholder="+7 (___) ___-__-__"
                                />
                                <Form.Text className="text-muted">
                                    Формат: +79991234567
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Пароль *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                    placeholder="Не менее 6 символов"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="name">
                                <Form.Label>Имя *</Form.Label>
                                <Form.Control
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ваше имя"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="surname">
                                <Form.Label>Фамилия *</Form.Label>
                                <Form.Control
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ваша фамилия"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="middlename">
                                <Form.Label>Отчество</Form.Label>
                                <Form.Control
                                    name="middlename"
                                    value={formData.middlename}
                                    onChange={handleChange}
                                    placeholder="Ваше отчество (необязательно)"
                                />
                            </Form.Group>

                            <div className="d-grid gap-2">
                                <Button 
                                    type="submit" 
                                    variant="primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                                </Button>
                            </div>
                        </Form>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default Register;