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

const Integrations = () => {
    const [integr, setIntegr] = useState(null);


    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, reqOptions)
            .then(response => response.json())
            .then(json => setIntegr(json))
            .catch(error => console.error(error));
    }, []);

    return (<>

        <Row className='m-2'>
            <Col xs={12} sm={12} md={4} lg={2}>
                <ProfileSidebar />
            </Col>
            <Col xs={12} sm={12} md={8} lg={10} className='px-5'>

                {integr ? <>
                    <h3 className='mb-2'>Интеграции со сторонними приложениями</h3>
                    <div className='fs-5 mb-2 fst-italic'>Здесь вы можете подключить сторонние сервисы для более продуктивной работы со студентами</div>
                    <hr />
                    <div>
                        <Row xs={1} sm={1} lg={2} xl={3}>
                            <Col>
                                <Card className="mb-4 style-outline">
                                    <Card.Img variant="top" src={planner} fluid className='style-img-card' />
                                    <Card.Body>
                                        <Card.Title className='mb-3'>
                                            Планировщик событий
                                        </Card.Title>
                                        <Card.Subtitle className="text-muted">
                                            Создавайте события в планировщике при назначении встреч, чтобы помнить о них.
                                        </Card.Subtitle>
                                        <hr />
                                        {integr.planner ?
                                            <>
                                                <Card.Text>
                                                    Подключенный сервис:
                                                </Card.Text>
                                                <Card.Text className="fs-5 ">
                                                    {integr.planner.type.name}
                                                </Card.Text>
                                                {integr.planner.planner_name ?
                                                    <>
                                                        <Card.Text>
                                                            Имя календаря, куда будут добавляться встречи:
                                                        </Card.Text>
                                                        <Card.Text className="text-muted">
                                                            {integr.planner.planner_name}
                                                        </Card.Text>
                                                    </>
                                                    : <>
                                                        <Card.Text>
                                                            Финальная настройка: выберите календарь, куда будут добавляться встречи:
                                                        </Card.Text>
                                                        <Card.Text className="text-muted">
                                                            <Button as="a" href="/integration/setplanner" className='style-button-outline mb-3'>Установить календарь</Button>
                                                        </Card.Text>
                                                    </>}
                                            </> :
                                            <>
                                                <Card.Text>
                                                    Доступные сервисы:
                                                </Card.Text>
                                                <Card.Text className="text-muted">
                                                    <Button as="a" href={`${googleCalendarAuth}`} className='style-button-outline mb-3'>Google Calendar</Button>
                                                </Card.Text>
                                            </>
                                        }

                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="mb-4 style-outline">
                                    <Card.Img variant="top" src={cloud} fluid className='style-img-card' />
                                    <Card.Body>
                                        <Card.Title className='mb-3'>
                                            Облачное хранилище
                                        </Card.Title>
                                        <Card.Subtitle className="text-muted">
                                            Автоматически создавайте папки к проектам и заданиям для хранения отчетов и других артефактов.
                                        </Card.Subtitle>
                                        <hr />
                                        {integr.cloud_drive ?
                                            <>
                                                <Card.Text>
                                                    Подключенный сервис:
                                                </Card.Text>
                                                <Card.Text className="fs-5 ">
                                                    {integr.cloud_drive.type.name}
                                                </Card.Text>

                                                {integr.cloud_drive.base_folder_name ?
                                                    <>
                                                        <Card.Text>
                                                            Корневая папка для проектов и заданий (находится в корне вашего хранилища):
                                                        </Card.Text>
                                                        <Card.Text className="text-muted">
                                                            {integr.cloud_drive.base_folder_name}
                                                        </Card.Text>
                                                    </>
                                                    : <>
                                                        <Card.Text className='text-danger'>
                                                            Корневая папка для проектов не найдена! Обратитесь в службу поддержки!
                                                        </Card.Text>
                                                    </>}
                                            </> :
                                            <>
                                                <Card.Text>
                                                    Доступные сервисы:
                                                </Card.Text>
                                                <Card.Text className="text-muted">
                                                    <Button as="a" href={`${googleDriveAuth}`} className='style-button-outline mb-3'>Google Drive</Button>
                                                </Card.Text>
                                                <Card.Text className="text-muted">
                                                    <Button as="a" href={`${yandexDiskAuth}`} className='style-button-outline mb-3'>Yandex Disk</Button>
                                                </Card.Text>
                                            </>
                                        }
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card className="mb-4 style-outline">
                                    <Card.Img variant="top" src={git} fluid className='style-img-card' />
                                    <Card.Body>
                                        <Card.Title className='mb-3'>
                                            Веб-хостинг репозиториев
                                        </Card.Title>
                                        <Card.Subtitle className="text-muted">
                                            Просматривайте активность по проекту, указав его репозиторий при создании.
                                        </Card.Subtitle>
                                        <hr />
                                        {integr.repo_hubs.length !== 0 ?
                                            <>
                                                <Card.Text>
                                                    Подключенный сервис(ы):
                                                </Card.Text>
                                                <Card.Text className="fs-5">
                                                    {integr.repo_hubs[0].name}
                                                </Card.Text>
                                            </> :
                                            <>
                                                <Card.Text>
                                                    Доступные сервисы:
                                                </Card.Text>
                                                <Card.Text className="text-muted">
                                                    <Button as="a" href={`${gitHubAuth}`} className='style-button-outline mb-3'>GitHub</Button>
                                                </Card.Text>
                                            </>
                                        }
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </> : SpinnerCenter()}

            </Col>
        </Row>
    </>);
};

export default Integrations;