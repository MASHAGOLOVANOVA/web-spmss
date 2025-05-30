import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { useNavigate } from 'react-router-dom';
import { Row, Card, Col, Button } from 'react-bootstrap';
import SpinnerCenter from 'pages/shared/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const cookies = new Cookies();

const reqOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json"
    }
};

function Applications() {
    const [applications, setApplications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/applications/professor`, reqOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.info(data);
                // Извлекаем массив applications из объекта
                setApplications(data.applications); // Обновляем состояние с полученными данными
            })
            .catch(error => {
                console.error(error);
                // Здесь можно добавить обработку ошибок, например, перенаправление на страницу ошибки
            });
    }, []);

    const handleApprove = (id, professor_id, student_id) => {
        const reqOptionsPut = {
            ...reqOptions,
            method: "PUT", // Указываем метод PUT
            body: JSON.stringify({
                "id": parseInt(id, 10),
                "student_id": parseInt(student_id,10),
                "professor_id": parseInt(professor_id, 10),
                "status": true
            })
        };
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/applications/${id}`, reqOptionsPut)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Удаляем одобренную заявку из состояния
            setApplications(prevApps => prevApps.filter(appl => appl.id !== id));
        })
        .catch(error => console.error(error));
};

    const handleReject = (id, professor_id, student_id) => {
        console.info(student_id)
        console.info(professor_id)
        const reqOptionsPut = {
            ...reqOptions,
            method: "PUT", // Указываем метод PUT
            body: JSON.stringify({
                "id": parseInt(id, 10),
                "student_id": parseInt(student_id,10),
                "professor_id": parseInt(professor_id, 10),
                "status": false
            })
        };
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/applications/${id}`, reqOptionsPut)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Удаляем одобренную заявку из состояния
            setApplications(prevApps => prevApps.filter(appl => appl.id !== id));
        })
        .catch(error => console.error(error));
};
// Фильтруем заявки, оставляя только те, которые на рассмотрении
const pendingApplications = applications.filter(appl => appl.status === "null");

return (
    <>
        <Row className='justify-content-center'>
            <Col xs={11} md={10} lg={8}>
                <h1>Заявки на научное руководство</h1>
                <hr />
                <div>
                    {pendingApplications.length > 0 ? (
                        <>
                            <div className='mb-2'>Найдено результатов: {pendingApplications.length}</div>
                            {pendingApplications.map((appl) => (
                                <Card key={appl.id} className="mb-4 style-outline">
                                    <Card.Header>{appl.student_name}</Card.Header>
                                    <Card.Body>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            На рассмотрении
                                        </Card.Subtitle>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Button variant="light" onClick={() => handleApprove(appl.id, appl.professor_id, appl.student_id)}>
                                                <FontAwesomeIcon icon={faCheck} /> Одобрить
                                            </Button>
                                            <Button variant="dark" onClick={() => handleReject(appl.id, appl.professor_id, appl.student_id)}>
                                                <FontAwesomeIcon icon={faTimes} /> Отклонить
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <Col>Заявок на рассмотрении нет!</Col>
                    )}
                </div>
            </Col>
        </Row>
    </>
);
};

export default Applications;