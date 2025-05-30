import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { Col, Card, Row, Button } from 'react-bootstrap';
import SpinnerCenter from 'pages/shared/Spinner';
import ProfileSidebar from './ProfileSidebar';
import cloud from './imgs/cloud.jpg';
import git from './imgs/git.jpg';
import planner from './imgs/planner.jpg';

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

const googleCalendarAuth = `${process.env.REACT_APP_ADDR}/integration/googlecalendar`;
const googleDriveAuth = `${process.env.REACT_APP_ADDR}/integration/googledrive`;
const yandexDiskAuth = `${process.env.REACT_APP_ADDR}/integration/yandexdisk`;
const gitHubAuth = `${process.env.REACT_APP_ADDR}/integration/github`;

function Profile() {
    const [user, setUser] = useState(null);
    const [integr, setIntegr] = useState(null);

    useEffect(() => {
        // Загружаем данные пользователя
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account`, reqOptions)
            .then(response => response.json())
            .then(json => setUser(json))
            .catch(error => console.error(error));

        // Загружаем данные интеграций
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, reqOptions)
            .then(response => response.json())
            .then(json => setIntegr(json))
            .catch(error => console.error(error));
    }, []);

    return (
        <>
            <Row className='m-2'>
                <Col xs={12} sm={12} md={8} lg={10} className='px-5'>
                    {user ? (
                        <>
                            {/* Блок с информацией о пользователе */}
                            <h3 className='mb-2'>{user.name}</h3>
                            <div className='fs-5 mb-2 fst-italic'>{user.science_degree}</div>
                            <div className='fs-3 mb-4 fw-medium'>{user.university}</div>
                            <hr className='mb-4'/>

                            {/* Блок с интеграциями */}
                            {integr ? (
                                <>
                                    <h3 className='mb-3'>Интеграции со сторонними приложениями</h3>
                                    <div className='fs-5 mb-4 fst-italic'>
                                        Подключенные сервисы для работы со студентами
                                    </div>
                                    
                                    <Row xs={1} sm={1} lg={2} xl={3} className='g-4'>
                                        <Col>
                                            <Card className="h-100 style-outline">
                                                <Card.Img variant="top" src={planner} fluid className='style-img-card' />
                                                <Card.Body>
                                                    <Card.Title className='mb-3'>Планировщик событий</Card.Title>
                                                    <Card.Subtitle className="text-muted mb-3">
                                                        Создавайте события в календаре при назначении встреч
                                                    </Card.Subtitle>
                                                    {integr.planner ? (
                                                        <>
                                                            <div className='fw-medium mb-2'>Подключенный сервис:</div>
                                                            <div className='fs-5 mb-3'>{integr.planner.type.name}</div>
                                                            {integr.planner.planner_name ? (
                                                                <>
                                                                    <div className='fw-medium mb-2'>Календарь для встреч:</div>
                                                                    <div className='text-muted'>{integr.planner.planner_name}</div>
                                                                </>
                                                            ) : (
                                                                <Button 
                                                                    href="/integration/setplanner" 
                                                                    variant="outline-primary"
                                                                    className='w-100 mt-2'
                                                                >
                                                                    Выбрать календарь
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            href={googleCalendarAuth} 
                                                            variant="outline-primary"
                                                            className='w-100 mt-2'
                                                        >
                                                            Подключить Google Calendar
                                                        </Button>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col>
                                            <Card className="h-100 style-outline">
                                                <Card.Img variant="top" src={cloud} fluid className='style-img-card' />
                                                <Card.Body>
                                                    <Card.Title className='mb-3'>Облачное хранилище</Card.Title>
                                                    <Card.Subtitle className="text-muted mb-3">
                                                        Автоматическое создание папок для проектов и заданий
                                                    </Card.Subtitle>
                                                    {integr.cloud_drive ? (
                                                        <>
                                                            <div className='fw-medium mb-2'>Подключенный сервис:</div>
                                                            <div className='fs-5 mb-3'>{integr.cloud_drive.type.name}</div>
                                                            {integr.cloud_drive.base_folder_name ? (
                                                                <>
                                                                    <div className='fw-medium mb-2'>Корневая папка:</div>
                                                                    <div className='text-muted'>{integr.cloud_drive.base_folder_name}</div>
                                                                </>
                                                            ) : (
                                                                <div className='text-danger'>
                                                                    Корневая папка не настроена
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className='d-flex flex-column gap-2'>
                                                            <Button 
                                                                href={googleDriveAuth} 
                                                                variant="outline-primary"
                                                                className='w-100'
                                                            >
                                                                Подключить Google Drive
                                                            </Button>
                                                            <Button 
                                                                href={yandexDiskAuth} 
                                                                variant="outline-primary"
                                                                className='w-100'
                                                            >
                                                                Подключить Yandex Disk
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col>
                                            <Card className="h-100 style-outline">
                                                <Card.Img variant="top" src={git} fluid className='style-img-card' />
                                                <Card.Body>
                                                    <Card.Title className='mb-3'>Веб-хостинг репозиториев</Card.Title>
                                                    <Card.Subtitle className="text-muted mb-3">
                                                        Просмотр активности по проектам
                                                    </Card.Subtitle>
                                                    {integr.repo_hubs?.length > 0 ? (
                                                        <>
                                                            <div className='fw-medium mb-2'>Подключенный сервис:</div>
                                                            <div className='fs-5'>{integr.repo_hubs[0].name}</div>
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            href={gitHubAuth} 
                                                            variant="outline-primary"
                                                            className='w-100 mt-2'
                                                        >
                                                            Подключить GitHub
                                                        </Button>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </>
                            ) : (
                                <SpinnerCenter />
                            )}
                        </>
                    ) : (
                        <SpinnerCenter />
                    )}
                </Col>
            </Row>
        </>
    );
}

export default Profile;